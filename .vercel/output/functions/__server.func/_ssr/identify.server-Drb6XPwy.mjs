//#region node_modules/.nitro/vite/services/ssr/assets/identify.server-Drb6XPwy.js
var CATS = [
	"epic",
	"comedy",
	"dialogue",
	"moral",
	"action",
	"revenge"
];
var WINDOW_MS = 6e5;
var MAX_CALLS = 12;
function takeSlot() {
	const g = globalThis;
	const now = Date.now();
	const hits = g.__identifyHits ??= [];
	while (hits.length && now - (hits[0] ?? 0) > WINDOW_MS) hits.shift();
	if (hits.length >= MAX_CALLS) return false;
	hits.push(now);
	return true;
}
function parseCuts(text, allowed) {
	const raw = (text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? text).trim();
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start < 0 || end <= start) return [];
	let parsed;
	try {
		parsed = JSON.parse(raw.slice(start, end + 1));
	} catch {
		return [];
	}
	const rows = parsed.cuts;
	if (!Array.isArray(rows)) return [];
	const out = [];
	for (const row of rows) {
		if (!row || typeof row !== "object") continue;
		const item = row;
		if (typeof item.id !== "string" || !allowed.has(item.id)) continue;
		if (out.some((c) => c.id === item.id)) continue;
		const category = CATS.includes(item.category) ? item.category : "dialogue";
		const title = typeof item.title === "string" ? item.title.replace(/\r/g, "").trim() : "";
		if (!title) continue;
		const reason = typeof item.reason === "string" ? item.reason.replace(/\s+/g, " ").trim().slice(0, 180) : "";
		out.push({
			id: item.id,
			category,
			title,
			reason
		});
		if (out.length >= 5) break;
	}
	return out;
}
async function judgeMomentsOnServer(moments) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Scene reading isn't available right now."
	};
	if (!takeSlot()) return {
		ok: false,
		error: "Scene reading is paused for a few minutes."
	};
	const clipped = moments.slice(0, 6).filter((m) => m.image.length > 80 && m.image.length < 18e4);
	if (clipped.length < 2) return {
		ok: false,
		error: "Not enough frames to read."
	};
	const content = [{
		type: "text",
		text: [
			"You are cutting portrait clips from a movie the viewer already owns.",
			"Each window is 50–59 seconds. The frame is from the first 5 seconds. Judge the opening, not the middle of the scene.",
			"Pick up to 5 windows where a stranger stops scrolling in the first 3 to 5 seconds: a face already reacting, a line already spoken, a joke landing, a hit, a threat, or a turn.",
			"Reject a slow walk-in, credits, a logo, a black frame, or silence at the open. Two windows of the same shot are one pick.",
			"Labels are optional. Use one only when the opening really is that kind of scene:",
			"epic = the turn. comedy = the bit people quote. dialogue = a line that lands while the picture is still.",
			"moral = the lesson, said or almost said. action = you don't look away. revenge = payback, quiet or loud.",
			"If the film has no joke, do not invent a comedy. Repeating a label is fine. Skip a weak open instead of filling a type.",
			"Rank the strongest openings first. If a spoken line is in the first 5 seconds, the title comes from that, not a generic hook.",
			"Title: exactly two lines, ALL CAPS, at most 6 words a line. Wrap the one or two hook words in *asterisks*. Those words cannot be THE, THIS, A, or IT.",
			"reason: one sentence about what happens in the first few seconds.",
			"Return only JSON: {\"cuts\":[{\"id\":\"m0\",\"category\":\"action\",\"title\":\"LINE ONE\\nDON'T *BLINK*\",\"reason\":\"why the open grabs\"}]}",
			"",
			...clipped.map((m) => {
				return [
					`${m.id} ${Math.round(m.start)}s–${Math.round(m.end)}s`,
					`guess=${m.category} hook=${m.score}`,
					`first 5s motion=${m.motion} contrast=${m.contrast} light=${m.lum} sound=${m.audio}`,
					m.openLine ? `opening line: ${m.openLine}` : "opening line: none",
					m.lines && m.lines !== m.openLine ? `later: ${m.lines}` : ""
				].filter(Boolean).join(" | ");
			})
		].join("\n")
	}];
	for (const moment of clipped) {
		content.push({
			type: "text",
			text: moment.id
		});
		content.push({
			type: "image_url",
			image_url: { url: `data:image/jpeg;base64,${moment.image}` }
		});
	}
	const ask = () => fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			temperature: .4,
			max_tokens: 700,
			messages: [{
				role: "user",
				content
			}]
		}),
		signal: AbortSignal.timeout(45e3)
	});
	let res;
	try {
		res = await ask();
		if (res.status === 429 || res.status >= 500) res = await ask();
	} catch {
		return {
			ok: false,
			error: "The scenes couldn't be read just now."
		};
	}
	if (!res.ok) return {
		ok: false,
		error: "The scenes couldn't be read."
	};
	let body;
	try {
		body = await res.json();
	} catch {
		return {
			ok: false,
			error: "The scenes couldn't be read."
		};
	}
	const cuts = parseCuts(body.choices?.[0]?.message?.content ?? "", new Set(clipped.map((m) => m.id)));
	if (!cuts.length) return {
		ok: false,
		error: "No scenes came back."
	};
	return {
		ok: true,
		cuts
	};
}
//#endregion
export { judgeMomentsOnServer };
