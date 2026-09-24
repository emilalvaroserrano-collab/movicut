//#region node_modules/.nitro/vite/services/ssr/assets/karaoke.server-BZlTAYpj.js
var WINDOW_MS = 6e5;
var MAX_CALLS = 24;
function takeSlot() {
	const g = globalThis;
	const now = Date.now();
	const hits = g.__karaokeHits ??= [];
	while (hits.length && now - (hits[0] ?? 0) > WINDOW_MS) hits.shift();
	if (hits.length >= MAX_CALLS) return false;
	hits.push(now);
	return true;
}
function readWords(body) {
	if (!body || typeof body !== "object") return [];
	const rec = body;
	const dur = typeof rec.duration === "number" ? rec.duration : 0;
	if (Array.isArray(rec.words)) {
		const out = [];
		for (const row of rec.words) {
			if (!row || typeof row !== "object") continue;
			const word = row;
			if (typeof word.text !== "string" || typeof word.start !== "number" || typeof word.end !== "number") continue;
			if (typeof word.confidence === "number" && word.confidence < .02) continue;
			const text = word.text.trim();
			if (!text || word.end <= word.start) continue;
			if (/^[\[(]?(?:music|applause|laughter|silence)[\])]?$/i.test(text)) continue;
			out.push({
				text,
				start: word.start,
				end: word.end
			});
			if (out.length >= 400) break;
		}
		if (out.length) return out;
	}
	if (typeof rec.text === "string" && dur > .3) {
		const parts = rec.text.split(/\s+/).filter(Boolean).slice(0, 80);
		if (!parts.length) return [];
		const step = dur / parts.length;
		return parts.map((text, i) => ({
			text,
			start: +(i * step).toFixed(2),
			end: +((i + 1) * step).toFixed(2)
		}));
	}
	return [];
}
async function transcribeWavOnServer(wavBase64) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Karaoke writing isn't available right now. Paste the lines instead."
	};
	if (!takeSlot()) return {
		ok: false,
		error: "Karaoke is paused for a few minutes. Paste the lines if you need them now."
	};
	const binary = Buffer.from(wavBase64, "base64");
	if (binary.byteLength < 1e3 || binary.byteLength > 6e6) return {
		ok: false,
		error: "That cut's audio can't be captioned."
	};
	const send = () => {
		const form = new FormData();
		form.append("model", "grok-voice-transcribe-2.0");
		form.append("file", new File([new Uint8Array(binary)], "cut.wav", { type: "audio/wav" }));
		return fetch("https://api.x.ai/v1/stt", {
			method: "POST",
			headers: { Authorization: `Bearer ${apiKey}` },
			body: form,
			signal: AbortSignal.timeout(7e4)
		});
	};
	let res;
	try {
		res = await send();
		if (res.status === 429 || res.status >= 500) res = await send();
	} catch {
		return {
			ok: false,
			error: "Karaoke couldn't be written just now. Try this cut again."
		};
	}
	if (!res.ok) return {
		ok: false,
		error: "Karaoke couldn't be written from that cut."
	};
	let json;
	try {
		json = await res.json();
	} catch {
		return {
			ok: false,
			error: "Karaoke couldn't be written from that cut."
		};
	}
	return {
		ok: true,
		words: readWords(json)
	};
}
//#endregion
export { transcribeWavOnServer };
