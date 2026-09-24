import { i as __toESM } from "../_runtime.mjs";
import { R as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as FolderOpen, i as Pause, n as RotateCcw, o as Download, r as Play, s as Captions } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CkcHnwoD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var button = cva("inline-flex items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-200 disabled:cursor-default disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pop", {
	variants: {
		variant: {
			primary: "bg-pop text-ink hover:bg-fg",
			quiet: "bg-surface text-fg ring-1 ring-line hover:bg-surface-2",
			ghost: "bg-transparent text-fg hover:bg-surface"
		},
		size: {
			md: "min-h-11 py-2.5",
			sm: "min-h-11 py-2 text-sm"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(button({
			variant,
			size
		}), className),
		...props
	});
}
var CATEGORY_ORDER = [
	"epic",
	"comedy",
	"dialogue",
	"moral",
	"action",
	"revenge"
];
var CATEGORY_LABEL = {
	epic: "Epic",
	comedy: "Comedy",
	dialogue: "Dialogue",
	moral: "Moral lesson",
	action: "Action",
	revenge: "Revenge"
};
var HOOKS = {
	epic: [
		"THIS IS THE MOMENT\nEVERYTHING *CHANGED*",
		"NOBODY IN THE ROOM\nWAS READY FOR *THIS*",
		"THE SCENE PEOPLE\n*PAUSE* ON"
	],
	comedy: [
		"HE REALLY THOUGHT\nTHAT WOULD *WORK*",
		"THIS SHOULD NOT\nBE THIS *FUNNY*",
		"WATCH THE FACE\nWHEN IT *LANDS*"
	],
	dialogue: [
		"THIS LINE\nSTILL *HITS*",
		"SAY IT AGAIN\n*SLOWER*",
		"THE LINE EVERYONE\n*REMEMBERS*"
	],
	moral: [
		"A WHOLE LESSON\nIN ONE *SCENE*",
		"THIS IS THE PART\nYOU *KEEP*",
		"HOW YOU TREAT THEM\nIS THE *POINT*"
	],
	action: [
		"DO NOT BLINK\nDURING *THIS*",
		"THIS IS WHERE\nIT *BREAKS*",
		"PURE MOTION\nNO *APOLOGY*"
	],
	revenge: [
		"THE QUIETEST\n*REVENGE*",
		"THEY FORGOT\nWHO THEY *HURT*",
		"THIS IS HOW\nPAYBACK *LOOKS*"
	]
};
var WORDS = {
	revenge: [
		"revenge",
		"payback",
		"betrayed",
		"betray",
		"never forgive",
		"you'll pay",
		"you will pay",
		"make you pay",
		"suffer",
		"kill you",
		"dead to me",
		"your fault",
		"owe me"
	],
	moral: [
		"never forget",
		"the right thing",
		"right thing",
		"family",
		"the truth",
		"honor",
		"honour",
		"promise",
		"kindness",
		"courage",
		"forgive",
		"what matters",
		"honest",
		"be better"
	],
	comedy: [
		"kidding",
		"joke",
		"ridiculous",
		"seriously",
		"hilarious",
		"are you kidding",
		"no way",
		"oh my god",
		"what the",
		"funny",
		"laugh"
	],
	action: [
		"get down",
		"watch out",
		"hurry",
		"fire",
		"look out",
		"come on",
		"go go",
		"shoot",
		"move"
	],
	epic: [
		"forever",
		"destiny",
		"together",
		"the world",
		"empire",
		"glory",
		"believe",
		"history",
		"kingdom"
	]
};
function avg(xs) {
	if (!xs.length) return 0;
	return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function variance(xs) {
	if (xs.length < 2) return 0;
	const m = avg(xs);
	return avg(xs.map((x) => (x - m) ** 2));
}
function clamp01(n) {
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}
function round2$1(n) {
	return Math.round(n * 100) / 100;
}
function hits(text, words) {
	let n = 0;
	for (const w of words) {
		const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		if (new RegExp(`(?:^|\\W)${escaped}(?:\\W|$)`, "i").test(text)) n += 1;
	}
	return Math.min(1, n / 2);
}
function plainTitle(src) {
	return src.replace(/\*/g, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}
function parseTitle(src) {
	return src.split("\n").slice(0, 2).map((line) => line.trim().split(/\s+/).filter(Boolean).map((w) => {
		const hot = w.length > 2 && w.startsWith("*") && w.endsWith("*");
		return {
			text: hot ? w.slice(1, -1) : w.replace(/\*/g, ""),
			hot
		};
	})).filter((line) => line.length > 0);
}
function titleFor(cat, start) {
	const bank = HOOKS[cat];
	return bank[Math.abs(Math.round(start * 10)) % bank.length];
}
function reasonFor(cat, subs, audio) {
	const head = {
		epic: "Big contrast and a surge that holds.",
		comedy: "A jumpy rhythm, the kind jokes live in.",
		dialogue: "The camera settles while people talk.",
		moral: "A quieter stretch with the shape of a lesson.",
		action: "The busiest frames in this part of the film.",
		revenge: "Darker pictures, the temperature of payback."
	};
	const tail = subs ? "Dialogue was part of the ranking." : audio ? "Picture and sound peaks only — an .srt will sharpen this." : "Picture energy only — add an .srt if the label feels wrong.";
	return `${head[cat]} ${tail}`;
}
function frameMetrics(prev, data) {
	if (!(data.length / 4)) return {
		diff: 0,
		lum: 0,
		contrast: 0
	};
	let mean = 0;
	let m2 = 0;
	let diff = 0;
	let count = 0;
	for (let i = 0; i < data.length; i += 4) {
		const y = (data[i] * .2126 + data[i + 1] * .7152 + data[i + 2] * .0722) / 255;
		count += 1;
		const delta = y - mean;
		mean += delta / count;
		m2 += delta * (y - mean);
		if (prev) {
			const py = (prev[i] * .2126 + prev[i + 1] * .7152 + prev[i + 2] * .0722) / 255;
			diff += Math.abs(y - py);
		}
	}
	return {
		lum: mean,
		contrast: Math.sqrt(m2 / count),
		diff: prev ? diff / count : 0
	};
}
function normalizeSamples(samples) {
	if (!samples.length) return samples;
	const diffs = samples.map((s) => s.diff).sort((a, b) => a - b);
	const p95 = diffs[Math.min(diffs.length - 1, Math.floor(diffs.length * .95))] || 1;
	let maxAudio = 0;
	for (const s of samples) if (s.audio > maxAudio) maxAudio = s.audio;
	return samples.map((s) => ({
		...s,
		diff: clamp01(s.diff / (p95 || 1)),
		audio: maxAudio > 0 ? s.audio / maxAudio : 0
	}));
}
function windowStats(samples, start, end) {
	const slice = samples.filter((s) => s.t >= start && s.t < end);
	if (!slice.length) return {
		motion: 0,
		motionVar: 0,
		lum: .5,
		contrast: 0,
		audio: 0,
		audioVar: 0
	};
	return {
		motion: avg(slice.map((s) => s.diff)),
		motionVar: variance(slice.map((s) => s.diff)),
		lum: avg(slice.map((s) => s.lum)),
		contrast: avg(slice.map((s) => s.contrast)),
		audio: avg(slice.map((s) => s.audio)),
		audioVar: variance(slice.map((s) => s.audio))
	};
}
function fitWindow(start, duration, cues) {
	if (duration < 50) return {
		start: 0,
		end: round2$1(Math.max(0, duration))
	};
	let s = Math.min(Math.max(0, start), Math.max(0, duration - 50));
	const near = cues.filter((c) => c.start >= s - .35 && c.start <= s + 2.2).sort((a, b) => a.start - b.start)[0];
	if (near) s = Math.max(0, near.start - .1);
	if (s + 50 > duration) s = Math.max(0, duration - 54);
	let e = s + 54;
	const boundary = cues.filter((c) => c.end >= s + 50 && c.end <= s + 59).sort((a, b) => Math.abs(a.end - (s + 54)) - Math.abs(b.end - (s + 54)))[0];
	if (boundary) e = boundary.end + .12;
	if (e - s < 50) e = s + 50;
	if (e - s > 59) e = s + 59;
	if (e > duration) {
		e = duration;
		s = Math.max(0, e - 54);
		if (e - s > 59) s = e - 59;
		if (e - s < 50) s = Math.max(0, e - 50);
	}
	if (e - s > 59) e = s + 59;
	return {
		start: round2$1(s),
		end: round2$1(Math.min(duration, e))
	};
}
function scoreCategories(st, text, hasSubs) {
	const revenge = hits(text, WORDS.revenge);
	const moral = hits(text, WORDS.moral);
	const comedy = hits(text, WORDS.comedy) + (text.split("?").length > 2 ? .35 : 0);
	const actionLex = hits(text, WORDS.action);
	const epic = hits(text, WORDS.epic);
	const wordCount = text.split(/\s+/).filter(Boolean).length;
	const density = Math.min(1, wordCount / 70);
	return {
		action: clamp01(st.motion * .72 + st.motionVar * .2 + actionLex * .6 + st.audio * .28),
		epic: clamp01(st.contrast * 1.3 + st.motion * .38 + epic * .55 + st.audio * .12),
		dialogue: clamp01((hasSubs ? density : 0) * .9 + (1 - st.motion) * .62 + (1 - Math.min(1, st.audioVar * 8)) * .1),
		comedy: clamp01(comedy * .95 + st.motionVar * 1.4 + st.audioVar * 4 + (st.lum > .22 && st.lum < .78 ? .08 : 0)),
		moral: clamp01(moral * 1.05 + (1 - st.motion) * .42 + density * .28 + (st.lum > .35 ? .08 : 0)),
		revenge: clamp01(revenge * 1.15 + (1 - st.lum) * .55 + st.motion * .12)
	};
}
function bestQuote(cues, start, end) {
	let best = null;
	for (const c of cues) {
		if (c.end <= start || c.start >= end) continue;
		const text = c.text.replace(/\s+/g, " ").trim();
		const words = text.split(" ").filter(Boolean);
		if (words.length < 2 || words.length > 14) continue;
		let score = 0;
		if (words.length >= 3 && words.length <= 8) score += 2;
		if (/[!?]/.test(text)) score += 1.1;
		if (text.length <= 42) score += .5;
		if (/^(yeah|ok|okay|um+|uh+|hmm+)\b/i.test(text)) score -= 2;
		if (!best || score > best.score) best = {
			text,
			score
		};
	}
	return best && best.score > .4 ? best.text : null;
}
function overlaps(a, b, gap) {
	return a.start < b.end + gap && b.start < a.end + gap;
}
function openingLine(cues, start) {
	return cues.filter((c) => c.end > start && c.start < start + 5).map((c) => c.text.replace(/\s+/g, " ").trim()).filter(Boolean).join(" ").slice(0, 140);
}
function openingValue(st, line) {
	const dead = st.lum < .07 || st.contrast < .035 ? .62 : 0;
	const speech = line.trim().length > 8 ? .26 : 0;
	return clamp01(st.motion * .46 + st.audio * .34 + st.contrast * .36 + st.motionVar * .16 + speech - dead);
}
function placeHook(samples, rough, duration, cues) {
	const slice = samples.filter((s) => s.t >= rough - 6 && s.t <= rough + 12);
	let peakT = rough;
	let best = -Infinity;
	for (const s of slice) {
		const value = (s.lum < .07 || s.contrast < .03 ? -1.2 : 0) + s.diff * .7 + s.audio * .55 + s.contrast * .35;
		if (value > best) {
			best = value;
			peakT = s.t;
		}
	}
	return fitWindow(Math.max(0, peakT - 2.6), duration, cues);
}
function topCategory(scores) {
	let category = "dialogue";
	let score = -1;
	for (const cat of CATEGORY_ORDER) if (scores[cat] > score) {
		score = scores[cat];
		category = cat;
	}
	return {
		category,
		score
	};
}
function pickCuts(samples, duration, cues, hasAudio) {
	if (duration < 50 || samples.length < 2) return [];
	const lead = duration > 1200 ? Math.min(150, duration * .02) : 0;
	const tail = duration > 1200 ? Math.min(180, duration * .035) : 0;
	const from = Math.min(lead, Math.max(0, duration - 59));
	const to = Math.max(from, duration - tail - 50);
	const step = duration < 180 ? 4 : duration < 600 ? 8 : 12;
	const starts = [];
	for (let s = from; s <= to + .01; s += step) starts.push(s);
	if (!starts.length) starts.push(Math.max(0, (duration - 54) / 2));
	const hasSubs = cues.length > 0;
	const cands = [];
	for (const s of starts) {
		const window = placeHook(samples, s, duration, cues);
		if (window.end - window.start < 49.5) continue;
		if (tail > 0 && window.end > duration - tail + 2 && window.start > duration * .9) continue;
		if (cands.length && Math.abs(cands[cands.length - 1].start - window.start) < 8) continue;
		const open = windowStats(samples, window.start, window.start + 5);
		const text = cues.filter((c) => c.end > window.start && c.start < window.end).map((c) => c.text).join(" ").toLowerCase();
		const lead = topCategory(scoreCategories(windowStats(samples, window.start, window.end), text, hasSubs));
		const hook = openingValue(open, openingLine(cues, window.start));
		cands.push({
			start: window.start,
			end: window.end,
			category: lead.category,
			score: hook * .78 + lead.score * .22,
			quote: bestQuote(cues, window.start, window.end)
		});
	}
	cands.sort((a, b) => b.score - a.score);
	const capacity = Math.max(1, Math.min(5, Math.floor((duration - lead - tail) / 62)));
	const picked = [];
	for (const cand of cands) {
		if (picked.length >= capacity) break;
		if (picked.some((cut) => overlaps(cut, cand, 12))) continue;
		picked.push(cand);
	}
	picked.sort((a, b) => a.start - b.start);
	return picked.map((c, i) => ({
		id: `${c.category}-${Math.round(c.start)}-${i}`,
		start: c.start,
		end: c.end,
		category: c.category,
		score: Math.round(c.score * 1e3) / 1e3,
		title: titleFor(c.category, c.start),
		reason: reasonFor(c.category, hasSubs, hasAudio),
		quote: c.quote ?? void 0
	}));
}
function windowLines(cues, start, end) {
	return cues.filter((c) => c.end > start && c.start < end).map((c) => c.text.replace(/\s+/g, " ").trim()).filter((text) => text.length > 1 && text.length < 90).slice(0, 4).join(" / ").slice(0, 240);
}
function bestFrameAt(samples, start, end, category) {
	const slice = samples.filter((s) => s.t >= start + 1.2 && s.t <= end - 1.2);
	const pool = slice.length ? slice : samples.filter((s) => s.t >= start && s.t < end);
	if (!pool.length) return null;
	let best = pool[0];
	let score = -Infinity;
	for (const s of pool) {
		const dead = s.lum < .06 || s.contrast < .03;
		const motionWeight = category === "action" || category === "comedy" ? .65 : .12;
		const value = (dead ? -2 : 0) + s.contrast + s.diff * motionWeight + (s.lum > .14 && s.lum < .86 ? .28 : 0) - Math.abs(s.lum - .45) * .15;
		if (value > score) {
			score = value;
			best = s;
		}
	}
	return best;
}
function toMoment(draft, samples, index) {
	const open = windowStats(samples, draft.start, draft.start + 5);
	const frame = bestFrameAt(samples, draft.start + .4, Math.min(draft.end, draft.start + 5), draft.category);
	return {
		id: `m${index}`,
		start: draft.start,
		end: draft.end,
		category: draft.category,
		score: Math.round(draft.energy * 1e3) / 1e3,
		quote: draft.quote,
		motion: Math.round(open.motion * 100) / 100,
		contrast: Math.round(open.contrast * 100) / 100,
		lum: Math.round((frame?.lum ?? open.lum) * 100) / 100,
		audio: Math.round(open.audio * 100) / 100,
		lines: draft.lines,
		openLine: draft.openLine,
		frameAt: frame?.t ?? draft.start + 2.5
	};
}
function spreadMoments(samples, duration, cues) {
	if (duration < 50 || samples.length < 2) return [];
	const lead = duration > 1200 ? Math.min(150, duration * .02) : 0;
	const tail = duration > 1200 ? Math.min(180, duration * .035) : 0;
	const from = Math.min(lead, Math.max(0, duration - 59));
	const to = Math.max(from, duration - tail - 50);
	const step = duration < 180 ? 6 : duration < 600 ? 10 : 16;
	const drafts = [];
	for (let s = from; s <= to + .01; s += step) {
		const window = placeHook(samples, s, duration, cues);
		if (window.end - window.start < 49.5) continue;
		if (drafts.length && Math.abs(drafts[drafts.length - 1].start - window.start) < 8) continue;
		const whole = windowStats(samples, window.start, window.end);
		const open = windowStats(samples, window.start, window.start + 5);
		const scores = scoreCategories(whole, cues.filter((c) => c.end > window.start && c.start < window.end).map((c) => c.text).join(" ").toLowerCase(), cues.length > 0);
		const lead = topCategory(scores);
		const spoken = openingLine(cues, window.start);
		const hook = openingValue(open, spoken);
		drafts.push({
			start: window.start,
			end: window.end,
			scores,
			category: lead.category,
			motion: open.motion,
			contrast: open.contrast,
			lum: open.lum,
			audio: open.audio,
			quote: bestQuote(cues, window.start, window.end),
			lines: windowLines(cues, window.start, window.end),
			openLine: spoken,
			energy: hook * .82 + lead.score * .18
		});
	}
	if (!drafts.length) return [];
	const ranked = [...drafts].sort((a, b) => b.energy - a.energy);
	const picked = [];
	for (const draft of ranked) {
		if (picked.length >= 6) break;
		if (picked.some((cut) => overlaps(cut, draft, 16))) continue;
		const frame = bestFrameAt(samples, draft.start + .4, Math.min(draft.end, draft.start + 5), draft.category);
		if (frame && frame.lum < .05 && frame.contrast < .03 && draft.energy < .22) continue;
		picked.push(toMoment(draft, samples, picked.length));
	}
	if (picked.length < 4) for (const draft of ranked) {
		if (picked.length >= 6) break;
		if (picked.some((cut) => Math.abs(cut.start - draft.start) < 8)) continue;
		if (picked.some((cut) => overlaps(cut, draft, 12))) continue;
		picked.push(toMoment(draft, samples, picked.length));
	}
	picked.sort((a, b) => a.start - b.start);
	return picked.slice(0, 6).map((moment, index) => ({
		...moment,
		id: `m${index}`
	}));
}
function seekTo(video, time, signal) {
	return new Promise((resolve, reject) => {
		const dur = Number.isFinite(video.duration) ? video.duration : time + 1;
		const target = Math.min(Math.max(time, 0), Math.max(dur - .05, 0));
		if (Math.abs(video.currentTime - target) < .08 && video.readyState >= 2) {
			resolve();
			return;
		}
		const timer = window.setTimeout(() => {
			cleanup();
			resolve();
		}, 2500);
		const onSeeked = () => {
			cleanup();
			resolve();
		};
		const onAbort = () => {
			cleanup();
			reject(new DOMException("Aborted", "AbortError"));
		};
		const cleanup = () => {
			window.clearTimeout(timer);
			video.removeEventListener("seeked", onSeeked);
			signal?.removeEventListener("abort", onAbort);
		};
		video.addEventListener("seeked", onSeeked);
		signal?.addEventListener("abort", onAbort);
		try {
			video.currentTime = target;
		} catch (err) {
			cleanup();
			reject(err instanceof Error ? err : /* @__PURE__ */ new Error("Could not seek"));
		}
	});
}
function grabThumb(video) {
	return grabFrame(video, 320, 180, .72);
}
function grabFrame(video, w, h, quality) {
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx || !video.videoWidth) return "";
	const scale = Math.max(w / video.videoWidth, h / video.videoHeight);
	const dw = video.videoWidth * scale;
	const dh = video.videoHeight * scale;
	ctx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
	return canvas.toDataURL("image/jpeg", quality);
}
async function audioEnergy(file, duration) {
	if (file.size > 18874368 || duration > 1200) return null;
	const AudioCtx = window.AudioContext;
	if (!AudioCtx) return null;
	const ctx = new AudioCtx();
	try {
		const ch = (await ctx.decodeAudioData(await file.arrayBuffer())).getChannelData(0);
		const buckets = Math.max(1, Math.ceil(duration));
		const energy = new Float32Array(buckets);
		const per = Math.max(1, Math.floor(ch.length / buckets));
		for (let i = 0; i < buckets; i++) {
			let sum = 0;
			let n = 0;
			const off = i * per;
			const stride = Math.max(1, Math.floor(per / 180));
			for (let j = 0; j < per; j += stride) {
				const v = ch[off + j] || 0;
				sum += v * v;
				n += 1;
			}
			energy[i] = Math.sqrt(sum / Math.max(1, n));
		}
		return energy;
	} catch {
		return null;
	} finally {
		await ctx.close().catch(() => void 0);
	}
}
async function analyzeMovie(opts) {
	const { video, file, duration, cues, signal, onProgress } = opts;
	const canvas = document.createElement("canvas");
	canvas.width = 48;
	canvas.height = 27;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) throw new Error("Could not read frames from this movie.");
	const step = duration < 180 ? 1 : duration < 600 ? 2 : Math.max(3, duration / 240);
	const times = [];
	for (let t = 0; t < duration - .2; t += step) times.push(t);
	if (!times.length) times.push(0);
	const audioPromise = audioEnergy(file, duration);
	const samples = [];
	let prev = null;
	for (let i = 0; i < times.length; i++) {
		if (signal.aborted) throw new DOMException("Aborted", "AbortError");
		await seekTo(video, times[i], signal);
		ctx.drawImage(video, 0, 0, 48, 27);
		const img = ctx.getImageData(0, 0, 48, 27);
		const m = frameMetrics(prev, img.data);
		samples.push({
			t: times[i],
			...m,
			audio: 0
		});
		prev = new Uint8ClampedArray(img.data);
		if (i % 2 === 0) {
			const clock = formatClock(times[i]);
			onProgress(i / times.length * .84, `Reading the picture at ${clock}`);
		}
	}
	onProgress(.86, "Listening for peaks");
	const energy = await Promise.race([audioPromise, new Promise((resolve) => {
		window.setTimeout(() => resolve(null), 8e3);
	})]);
	if (energy) for (const s of samples) s.audio = energy[Math.min(energy.length - 1, Math.max(0, Math.floor(s.t)))] ?? 0;
	onProgress(.93, "Choosing five cuts");
	const norm = normalizeSamples(samples);
	const cuts = pickCuts(norm, duration, cues, !!energy);
	const moments = spreadMoments(norm, duration, cues);
	for (let i = 0; i < cuts.length; i++) {
		if (signal.aborted) throw new DOMException("Aborted", "AbortError");
		await seekTo(video, Math.min(duration - .08, cuts[i].start + 1.25), signal);
		const thumb = grabThumb(video);
		if (thumb) cuts[i].thumb = thumb;
	}
	const shots = [];
	for (let i = 0; i < moments.length; i++) {
		if (signal.aborted) throw new DOMException("Aborted", "AbortError");
		const moment = moments[i];
		await seekTo(video, Math.min(duration - .08, Math.max(0, moment.frameAt)), signal);
		const image = grabFrame(video, 320, 180, .62);
		if (image) shots.push({
			...moment,
			image
		});
		onProgress(.93 + .06 * (i + 1) / Math.max(1, moments.length), "Pulling a frame from each stretch");
	}
	onProgress(1, "Cuts are ready");
	return {
		cuts,
		shots,
		samples: norm,
		usedAudio: !!energy
	};
}
function formatClock(t) {
	const s = Math.max(0, Math.floor(t));
	const m = Math.floor(s / 60);
	const sec = s % 60;
	const h = Math.floor(m / 60);
	if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
	return `${m}:${String(sec).padStart(2, "0")}`;
}
async function refreshThumbs(video, cuts, signal) {
	const next = cuts.map((c) => ({ ...c }));
	const dur = Number.isFinite(video.duration) ? video.duration : 0;
	for (const cut of next) {
		await seekTo(video, Math.min(Math.max(dur - .08, 0), cut.start + 1.1), signal);
		const thumb = grabThumb(video);
		if (thumb) cut.thumb = thumb;
	}
	return next;
}
var IVORY = "#f4efe4";
var YELLOW = "#ffe14a";
var INK = "#140f08";
function sourceSize(source) {
	if (!source) return null;
	if (source instanceof HTMLVideoElement) {
		if (!source.videoWidth || !source.videoHeight) return null;
		return {
			w: source.videoWidth,
			h: source.videoHeight
		};
	}
	if (!source.complete || !source.naturalWidth) return null;
	return {
		w: source.naturalWidth,
		h: source.naturalHeight
	};
}
function drawWords(ctx, words, cx, y, maxW, startSize, family, weight) {
	if (!words.length) return;
	const plain = words.map((w) => w.text).join(" ");
	let size = startSize;
	const setFont = () => {
		ctx.font = `${weight} ${size}px ${family}`;
	};
	setFont();
	while (size > 20 && ctx.measureText(plain).width > maxW) {
		size -= 2;
		setFont();
	}
	const space = ctx.measureText(" ").width;
	const widths = words.map((w) => ctx.measureText(w.text).width);
	let x = cx - (widths.reduce((a, b) => a + b, 0) + space * Math.max(0, words.length - 1)) / 2;
	ctx.textBaseline = "middle";
	ctx.lineJoin = "round";
	ctx.miterLimit = 2;
	ctx.lineWidth = Math.max(5, size / 5.5);
	ctx.strokeStyle = INK;
	for (let i = 0; i < words.length; i++) {
		ctx.strokeText(words[i].text, x, y);
		ctx.fillStyle = words[i].hot ? YELLOW : IVORY;
		ctx.fillText(words[i].text, x, y);
		x += widths[i] + space;
	}
}
function coverCrop(ctx, source, sw, sh, x, y, w, h) {
	const scale = Math.max(w / sw, h / sh);
	const dw = sw * scale;
	const dh = sh * scale;
	ctx.save();
	ctx.beginPath();
	ctx.rect(x, y, w, h);
	ctx.clip();
	ctx.drawImage(source, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
	ctx.restore();
}
function drawStage(ctx, w, h, source, title, caption) {
	ctx.clearRect(0, 0, w, h);
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, w, h);
	const lines = title.slice(0, 2);
	const titleSize = Math.round(w * .112);
	const lineGap = titleSize * 1.02;
	const picH = Math.round(w * (9 / 16));
	const block = Math.max(lineGap, lines.length * lineGap);
	const titleTop = Math.max(0, h - picH - block - titleSize * .4) * .34 + titleSize * .72;
	const pic = {
		x: 0,
		y: titleTop + Math.max(0, lines.length - 1) * lineGap + titleSize * .62,
		w,
		h: picH
	};
	const size = sourceSize(source);
	if (source && size) coverCrop(ctx, source, size.w, size.h, pic.x, pic.y, pic.w, pic.h);
	lines.forEach((line, i) => {
		drawWords(ctx, line, w / 2, titleTop + i * lineGap, w * .94, titleSize, "Anton", "400");
	});
	if (caption && caption.alpha > .02 && caption.words.length) {
		ctx.save();
		ctx.globalAlpha = caption.alpha;
		const cy = pic.y + pic.h + titleSize * 1.15;
		drawWords(ctx, caption.words, w / 2, cy, w * .9, Math.round(w * .055), "\"DM Sans\"", "800");
		ctx.restore();
	}
}
var BED_VOLUME = .15;
function bedSrc(category) {
	if (category === "dialogue" || category === "moral" || category === "comedy") return "/score-dawn.mp3";
	return "/score-suspense.mp3";
}
var VIDEO = /\.(mp4|m4v|webm|mov|mkv)$/i;
function parseMagnet(raw) {
	const text = raw.trim();
	if (!/^magnet:\?/i.test(text)) return null;
	if (!/xt=urn:bt[im]h:[a-z0-9]+/i.test(text)) return null;
	return text;
}
function hint(magnet) {
	return ((magnet.match(/btih:([a-z0-9]+)/i) ?? magnet.match(/btmh:([a-z0-9]+)/i))?.[1] ?? "movie").slice(0, 12).toLowerCase();
}
async function storeStream(name, storageName, stream, length, onProgress, signal) {
	const root = await navigator.storage?.getDirectory?.();
	if (!root) {
		if (length > 367001600) throw new Error("This browser can't store a movie that large from a magnet. Open the file from this device instead.");
		const chunks = [];
		const reader = stream.getReader();
		let got = 0;
		while (true) {
			if (signal.aborted) throw new DOMException("Aborted", "AbortError");
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(new Uint8Array(value));
			got += value.byteLength;
			onProgress(Math.min(.99, got / Math.max(1, length)), `Fetching ${name}`);
		}
		return new File(chunks, name, { type: "video/mp4" });
	}
	await navigator.storage?.persist?.().catch(() => void 0);
	const safe = storageName.replace(/[^\w.\- ]+/g, "_").slice(-80);
	const handle = await root.getFileHandle(safe, { create: true });
	const writable = await handle.createWritable();
	const reader = stream.getReader();
	let got = 0;
	try {
		while (true) {
			if (signal.aborted) throw new DOMException("Aborted", "AbortError");
			const { done, value } = await reader.read();
			if (done) break;
			const copy = new Uint8Array(value.byteLength);
			copy.set(value);
			await writable.write(new Blob([copy]));
			got += value.byteLength;
			onProgress(Math.min(.99, got / Math.max(1, length)), `Fetching ${name}`);
		}
		await writable.close();
	} catch (err) {
		await writable.abort?.().catch(() => void 0);
		throw err;
	}
	return handle.getFile();
}
async function fileFromMagnet(magnet, onProgress, signal) {
	if (typeof window === "undefined") throw new Error("A magnet can only be opened in the browser.");
	onProgress(.02, "Looking for peers");
	const { default: WebTorrent } = await import("../_libs/webtorrent.mjs").then((n) => n.t);
	const client = new WebTorrent();
	let settled = false;
	const torrent = await new Promise((resolve, reject) => {
		const fail = (err) => {
			if (settled) return;
			settled = true;
			reject(err instanceof Error ? err : /* @__PURE__ */ new Error("The magnet couldn't be opened."));
		};
		const timer = window.setTimeout(() => fail(/* @__PURE__ */ new Error("No peers answered. Check the magnet link and try again.")), 6e4);
		signal.addEventListener("abort", () => {
			window.clearTimeout(timer);
			fail(new DOMException("Aborted", "AbortError"));
		});
		client.on("error", fail);
		try {
			client.add(magnet, { destroyStoreOnDestroy: true }, (ready) => {
				window.clearTimeout(timer);
				if (settled) return;
				settled = true;
				resolve(ready);
			}).on("error", fail);
		} catch (err) {
			window.clearTimeout(timer);
			fail(err instanceof Error ? err : /* @__PURE__ */ new Error("That magnet link isn't usable."));
		}
	}).catch((err) => {
		client.destroy();
		throw err;
	});
	try {
		const video = torrent.files.filter((file) => VIDEO.test(file.name)).sort((a, b) => b.length - a.length)[0];
		if (!video) throw new Error("That torrent has no movie file.");
		for (const file of torrent.files) if (file !== video) file.deselect();
		video.select(1);
		onProgress(.04, `Fetching ${video.name}`);
		return await storeStream(video.name, `${hint(magnet)}-${video.name}`, video.stream(), video.length, onProgress, signal);
	} finally {
		client.destroy();
	}
}
function parseTimestamp(raw) {
	const ts = raw.trim().replace(",", ".");
	const parts = ts.split(":");
	if (parts.length === 3) return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
	if (parts.length === 2) return Number(parts[0]) * 60 + Number(parts[1]);
	const n = Number(ts);
	return Number.isFinite(n) ? n : 0;
}
function cleanLine(text) {
	return text.replace(/<[^>]+>/g, "").replace(/\{[^}]+\}/g, "").replace(/&nbsp;/g, " ").replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/\s+/g, " ").trim();
}
function parseSubtitles(input) {
	const blocks = input.replace(/^\uFEFF/, "").replace(/\r/g, "").split(/\n{2,}/);
	const cues = [];
	for (const block of blocks) {
		const lines = block.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("WEBVTT") && !l.startsWith("NOTE") && !l.startsWith("STYLE") && !/^Kind:|^Language:/.test(l));
		const timing = lines.findIndex((l) => l.includes("-->"));
		if (timing === -1) continue;
		const [rawStart, rawEnd] = lines[timing].split("-->");
		if (!rawEnd) continue;
		const text = cleanLine(lines.slice(timing + 1).join(" "));
		if (!text) continue;
		const start = parseTimestamp(rawStart);
		const end = parseTimestamp(rawEnd.trim().split(/\s+/)[0] ?? "");
		if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
		cues.push({
			start,
			end,
			text,
			source: "file"
		});
	}
	cues.sort((a, b) => a.start - b.start);
	return cues;
}
function chunkWords(words) {
	if (words.length <= 5) return [words];
	const size = words.length > 8 ? 4 : 5;
	const chunks = [];
	for (let i = 0; i < words.length; i += size) chunks.push(words.slice(i, i + size));
	return chunks;
}
function cuesToPhrases(cues) {
	const phrases = [];
	cues.forEach((cue, index) => {
		if (cue.words?.length) {
			const words = cue.words.filter((w) => w.text && w.end > w.start);
			if (!words.length) return;
			phrases.push({
				id: `${index}-w`,
				start: words[0].start,
				end: Math.max(words[words.length - 1].end, words[0].start + .18),
				words
			});
			return;
		}
		const raw = cue.text.split(/\s+/).filter(Boolean);
		if (raw.length === 0) return;
		const chunks = chunkWords(raw);
		const weights = chunks.map((c) => c.join("").length || 1);
		const total = weights.reduce((a, b) => a + b, 0);
		const span = Math.max(.24, cue.end - cue.start);
		let cursor = cue.start;
		chunks.forEach((words, ci) => {
			const isLast = ci === chunks.length - 1;
			const dur = span * (weights[ci] / total);
			const start = cursor;
			const nominalEnd = isLast ? cue.end : cursor + dur;
			const end = Math.max(start + .18, nominalEnd - (isLast ? .06 : .1));
			cursor = isLast ? cue.end : nominalEnd;
			const ww = words.map((w) => w.length || 1);
			const wt = ww.reduce((a, b) => a + b, 0);
			let wc = start;
			const wordObjs = words.map((text, wi) => {
				const d = (end - start) * ww[wi] / wt;
				const ws = wc;
				const we = wi === words.length - 1 ? end : wc + d;
				wc = we;
				return {
					text,
					start: ws,
					end: we
				};
			});
			phrases.push({
				id: `${index}-${ci}`,
				start,
				end,
				words: wordObjs
			});
		});
	});
	return phrases;
}
function phraseAt(phrases, t) {
	for (let i = phrases.length - 1; i >= 0; i--) {
		const p = phrases[i];
		if (t >= p.start && t < p.end) return p;
	}
	return null;
}
function wordIndexAt(phrase, t) {
	for (let i = 0; i < phrase.words.length; i++) if (t < phrase.words[i].end) return i;
	return Math.max(0, phrase.words.length - 1);
}
function linesToCues(lines, start, end) {
	const usable = lines.map((l) => l.trim()).filter(Boolean);
	if (!usable.length || end <= start) return [];
	const span = (end - start) / usable.length;
	return usable.map((text, i) => {
		const cueStart = start + i * span;
		const cueEnd = i === usable.length - 1 ? end - .05 : cueStart + span - .12;
		return {
			start: cueStart,
			end: Math.max(cueStart + .2, cueEnd),
			text,
			source: "pasted"
		};
	});
}
var NOISE = /^(?:[\[(]?\s*(?:music|applause|laughter|silence|noise|sighs?|breathing|inaudible)\s*[\])]?|♪+|♫+)$/i;
function wordsToCues(words, cutId) {
	const clean = words.filter((w) => {
		const text = w.text.trim();
		return text.length > 0 && w.end > w.start + .02 && !NOISE.test(text);
	});
	const groups = [];
	let cur = [];
	for (const word of clean) {
		const prev = cur[cur.length - 1];
		const gap = prev ? word.start - prev.end : 0;
		if (cur.length && (cur.length >= 4 || gap > .45)) {
			groups.push(cur);
			cur = [];
		}
		cur.push({
			...word,
			text: word.text.trim()
		});
	}
	if (cur.length) groups.push(cur);
	return groups.map((group) => ({
		start: group[0].start,
		end: Math.max(group[group.length - 1].end, group[0].start + .18),
		text: group.map((w) => w.text).join(" "),
		source: "heard",
		cutId,
		words: group
	}));
}
var DEMO_TITLE = "THIS IS HOW\nA QUIET SCENE *TURNS*";
var DEMO_LOOP = 12.4;
var DEMO_PHRASES = cuesToPhrases([
	{
		start: .35,
		end: 2.55,
		text: "Wait. Say that again."
	},
	{
		start: 3.05,
		end: 5.2,
		text: "I kept the ticket."
	},
	{
		start: 5.75,
		end: 8.75,
		text: "You already know how this ends."
	},
	{
		start: 9.2,
		end: 11.85,
		text: "Then don't look away."
	}
]);
function formatTimecode(t) {
	if (!Number.isFinite(t) || t < 0) return "0:00";
	const s = Math.floor(t);
	const h = Math.floor(s / 3600);
	const m = Math.floor(s % 3600 / 60);
	const sec = s % 60;
	if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
	return `${m}:${String(sec).padStart(2, "0")}`;
}
function formatBytes(n) {
	if (!Number.isFinite(n) || n <= 0) return "0 B";
	const units = [
		"B",
		"KB",
		"MB",
		"GB"
	];
	let v = n;
	let i = 0;
	while (v >= 1024 && i < units.length - 1) {
		v /= 1024;
		i += 1;
	}
	const digits = v >= 10 || i === 0 ? 0 : 1;
	return `${v.toFixed(digits)} ${units[i]}`;
}
function formatSeconds(n) {
	if (!Number.isFinite(n)) return "0s";
	return `${Math.round(n)}s`;
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var transcribeClip = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input.wavBase64 !== "string" || input.wavBase64.length < 200 || input.wavBase64.length > 8e6) throw new Error("That cut's audio can't be captioned.");
	return { wavBase64: input.wavBase64 };
}).handler(createSsrRpc("7d305bc4556981cf000308f16c62017b5c56759c3c248ed266b93ba25d5e79bb"));
async function blobToBase64(blob) {
	const dataUrl = await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result ?? ""));
		reader.onerror = () => reject(/* @__PURE__ */ new Error("Couldn't pack that cut's audio."));
		reader.readAsDataURL(blob);
	});
	const comma = dataUrl.indexOf(",");
	return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}
async function extractCutWav(file, start, end, isStale) {
	if (!(end > start + .4) || end - start > 70) throw new Error("That cut isn't a captionable length.");
	const { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Output, WavOutputFormat } = await import("../_libs/mediabunny.mjs").then((n) => n.t);
	const input = new Input({
		source: new BlobSource(file),
		formats: ALL_FORMATS
	});
	const target = new BufferTarget();
	const output = new Output({
		format: new WavOutputFormat(),
		target
	});
	let conversion = null;
	const watch = window.setInterval(() => {
		if (isStale()) conversion?.cancel();
	}, 250);
	try {
		conversion = await Conversion.init({
			input,
			output,
			showWarnings: false,
			tracks: "primary",
			video: { discard: true },
			audio: {
				codec: "pcm-s16",
				sampleRate: 16e3,
				numberOfChannels: 1
			},
			trim: {
				start,
				end
			}
		});
		if (isStale()) {
			conversion.cancel();
			throw new Error("stale");
		}
		if (!conversion.isValid) throw new Error("This movie's audio can't be read here. Add an .srt, or paste the lines.");
		await conversion.execute();
		if (isStale()) throw new Error("stale");
		const buffer = target.buffer;
		if (!buffer || buffer.byteLength < 1e3) throw new Error("Couldn't hear enough of that cut.");
		return new Blob([buffer], { type: "audio/wav" });
	} catch (err) {
		if (isStale() || err instanceof Error && err.message === "stale") throw new Error("stale");
		if (err instanceof Error && /can't be read|captionable|hear enough/.test(err.message)) throw err;
		throw new Error("Couldn't pull the dialogue out of that cut. Add an .srt, or paste the lines.");
	} finally {
		window.clearInterval(watch);
		input.dispose();
	}
}
async function transcribeWav(wav) {
	const result = await transcribeClip({ data: { wavBase64: await blobToBase64(wav) } });
	if (!result.ok) throw new Error(result.error);
	return result.words;
}
var WEAK_HOOKS = /* @__PURE__ */ new Set([
	"THE",
	"THIS",
	"A",
	"AN",
	"IT",
	"AND",
	"OF",
	"TO",
	"IN",
	"ON",
	"IS",
	"FOR",
	"YOU"
]);
function hookWord(line) {
	const parts = line.replace(/\*/g, "").split(" ").filter(Boolean);
	for (let i = parts.length - 1; i >= 0; i--) {
		const bare = parts[i].replace(/[^A-Z0-9]/g, "");
		if (bare && !WEAK_HOOKS.has(bare)) return parts.map((part, index) => index === i ? `*${part}*` : part).join(" ");
	}
	if (!parts.length) return line;
	parts[parts.length - 1] = `*${parts[parts.length - 1]}*`;
	return parts.join(" ");
}
function cleanTitle(raw) {
	const lines = raw.replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 2).map((line) => line.toUpperCase().replace(/\s+/g, " ").slice(0, 52));
	if (!lines.length) return "THIS SCENE\n*HITS*";
	return lines.map((line) => {
		const hooks = [...line.matchAll(/\*([^*]+)\*/g)].map((match) => match[1].replace(/[^A-Z0-9]/g, ""));
		if (!hooks.length || hooks.every((word) => WEAK_HOOKS.has(word))) return hookWord(line);
		return line;
	}).join("\n");
}
function cutsFromJudgement(fallback, shots, judged) {
	const byId = new Map(shots.map((shot) => [shot.id, shot]));
	const next = [];
	const overlaps = (start, end) => next.some((cut) => start < cut.end + 12 && cut.start < end + 12);
	for (const row of judged) {
		const shot = byId.get(row.id);
		if (!shot || overlaps(shot.start, shot.end)) continue;
		const category = row.category || shot.category;
		next.push({
			id: `${category}-${Math.round(shot.start)}-${next.length}`,
			start: shot.start,
			end: shot.end,
			category,
			score: shot.score,
			title: cleanTitle(row.title),
			reason: row.reason || "The first few seconds grab.",
			quote: shot.quote ?? void 0,
			thumb: shot.image
		});
		if (next.length >= 5) break;
	}
	if (next.length < 5) for (const cut of [...fallback].sort((a, b) => b.score - a.score)) {
		if (next.length >= 5) break;
		if (overlaps(cut.start, cut.end)) continue;
		next.push({
			...cut,
			id: `${cut.category}-${Math.round(cut.start)}-${next.length}`
		});
	}
	return next.length ? next : fallback;
}
var judgeMoments = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || !Array.isArray(input.moments) || input.moments.length < 2 || input.moments.length > 6) throw new Error("Not enough scenes to read.");
	return { moments: input.moments.map((moment) => ({
		id: String(moment.id).slice(0, 12),
		start: Number(moment.start) || 0,
		end: Number(moment.end) || 0,
		category: String(moment.category).slice(0, 16),
		score: Number(moment.score) || 0,
		quote: String(moment.quote ?? "").slice(0, 140),
		lines: String(moment.lines ?? "").slice(0, 240),
		openLine: String(moment.openLine ?? "").slice(0, 160),
		motion: Number(moment.motion) || 0,
		contrast: Number(moment.contrast) || 0,
		lum: Number(moment.lum) || 0,
		audio: Number(moment.audio) || 0,
		image: String(moment.image ?? "").replace(/^data:image\/jpeg;base64,/, "").slice(0, 18e4)
	})) };
}).handler(createSsrRpc("68155b852f651cbb5e4fc5e23d5c9d45dd8645758aa80bc18b9f32a6ecd1e8d0"));
var LS_KEY = "hookcut-project-v1";
var DB_NAME = "hookcut";
var STORE = "handles";
function loadProject() {
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return null;
		const data = JSON.parse(raw);
		if (!data || typeof data.name !== "string" || !Array.isArray(data.cuts)) return null;
		return data;
	} catch {
		return null;
	}
}
function saveProject(project) {
	try {
		localStorage.setItem(LS_KEY, JSON.stringify(project));
	} catch {}
}
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("Could not open device storage"));
	});
}
async function saveMovieHandle(handle) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).put(handle, "movie");
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error ?? /* @__PURE__ */ new Error("Could not remember the movie"));
	});
	db.close();
}
async function loadMovieHandle() {
	const db = await openDb();
	const handle = await new Promise((resolve, reject) => {
		const req = db.transaction(STORE, "readonly").objectStore(STORE).get("movie");
		req.onsuccess = () => resolve(req.result ?? null);
		req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("Could not read the remembered movie"));
	});
	db.close();
	return handle;
}
async function hasMovieHandle() {
	try {
		return await loadMovieHandle() != null;
	} catch {
		return false;
	}
}
var BLURB = {
	epic: "The turn that makes the rest of the film make sense.",
	comedy: "The bit people quote when they retell it.",
	dialogue: "A line that still lands with the picture held still.",
	moral: "The lesson, said out loud or almost.",
	action: "The stretch you don't look away from.",
	revenge: "Payback, quiet or loud."
};
function signalsFrom(audio, subs) {
	const list = ["Picture energy"];
	if (audio) list.push("Sound peaks");
	if (subs) list.push("Dialogue file");
	return list;
}
function round2(n) {
	return Math.round(n * 100) / 100;
}
function windowKey(cut) {
	return `${round2(cut.start)}-${round2(cut.end)}`;
}
function isUploadedSubs(name) {
	return !!name && name !== "Heard from the cut" && name !== "Pasted lines";
}
function MagnetBar(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mt-4 grid gap-2",
		onSubmit: (e) => {
			e.preventDefault();
			props.onSubmit();
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "grid gap-2 text-sm text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Magnet link. The movie downloads into this browser." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: props.value,
					onChange: (e) => props.onChange(e.target.value),
					placeholder: "magnet:?xt=urn:btih:…",
					spellCheck: false,
					autoCapitalize: "off",
					disabled: props.disabled || props.fetching,
					className: "min-h-11 min-w-0 flex-1 rounded-full bg-bg px-4 text-sm text-fg ring-1 ring-line outline-none focus:ring-pop"
				}), props.fetching ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "quiet",
					onClick: props.onStop,
					children: "Stop"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					variant: "quiet",
					disabled: props.disabled || !props.value.trim(),
					children: "Open magnet"
				})]
			})]
		}), props.fetching ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-3 text-sm text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "truncate",
				children: props.label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "tabular-nums",
				children: [Math.round(props.progress * 100), "%"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full bg-pop",
				style: { width: `${Math.round(props.progress * 100)}%` }
			})
		})] }) : null]
	});
}
function Studio() {
	const videoRef = (0, import_react.useRef)(null);
	const bedRef = (0, import_react.useRef)(null);
	const recordingRef = (0, import_react.useRef)(false);
	const titleFitRef = (0, import_react.useRef)(null);
	const [titleScale, setTitleScale] = (0, import_react.useState)(1);
	const movieInputRef = (0, import_react.useRef)(null);
	const srtInputRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const samplesRef = (0, import_react.useRef)(null);
	const usedAudioRef = (0, import_react.useRef)(false);
	const demoModeRef = (0, import_react.useRef)(true);
	const demoPlayingRef = (0, import_react.useRef)(true);
	const playingRef = (0, import_react.useRef)(false);
	const activeCutRef = (0, import_react.useRef)(null);
	const phrasesRef = (0, import_react.useRef)([]);
	const titleRef = (0, import_react.useRef)(DEMO_TITLE);
	const statusRef = (0, import_react.useRef)("empty");
	const abortRef = (0, import_react.useRef)(null);
	const toggleRef = (0, import_react.useRef)(() => {});
	const manualLockRef = (0, import_react.useRef)(false);
	const heardWindowRef = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const queueRef = (0, import_react.useRef)([]);
	const pumpingRef = (0, import_react.useRef)(false);
	const inflightRef = (0, import_react.useRef)(null);
	const hearGenRef = (0, import_react.useRef)(0);
	const pumpRef = (0, import_react.useRef)(() => {});
	const [status, setStatus] = (0, import_react.useState)("empty");
	const [error, setError] = (0, import_react.useState)(null);
	const [fileMeta, setFileMeta] = (0, import_react.useState)(null);
	const [cuts, setCuts] = (0, import_react.useState)([]);
	const [activeId, setActiveId] = (0, import_react.useState)(null);
	const [cues, setCues] = (0, import_react.useState)([]);
	const [srtName, setSrtName] = (0, import_react.useState)(null);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const [progressLabel, setProgressLabel] = (0, import_react.useState)("");
	const [playing, setPlaying] = (0, import_react.useState)(true);
	const [now, setNow] = (0, import_react.useState)(0);
	const [liveLine, setLiveLine] = (0, import_react.useState)("");
	const [recording, setRecording] = (0, import_react.useState)(false);
	recordingRef.current = recording;
	const [remembered, setRemembered] = (0, import_react.useState)(false);
	const [canRerank, setCanRerank] = (0, import_react.useState)(false);
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const [magnet, setMagnet] = (0, import_react.useState)("");
	const [fetching, setFetching] = (0, import_react.useState)(false);
	const magnetAbortRef = (0, import_react.useRef)(null);
	const [signalList, setSignalList] = (0, import_react.useState)(["Picture energy"]);
	const [lineDraft, setLineDraft] = (0, import_react.useState)("");
	const [demoStill, setDemoStill] = (0, import_react.useState)(0);
	const [hearingId, setHearingId] = (0, import_react.useState)(null);
	const [silentIds, setSilentIds] = (0, import_react.useState)([]);
	const [hearError, setHearError] = (0, import_react.useState)(null);
	const phrases = (0, import_react.useMemo)(() => cuesToPhrases(cues), [cues]);
	const cuesRef = (0, import_react.useRef)(cues);
	cuesRef.current = cues;
	const cutsRef = (0, import_react.useRef)(cuts);
	cutsRef.current = cuts;
	const active = cuts.find((c) => c.id === activeId) ?? null;
	const longEnough = (fileMeta?.duration ?? 0) >= 50;
	activeCutRef.current = active;
	phrasesRef.current = phrases;
	demoModeRef.current = !fileMeta;
	statusRef.current = status;
	titleRef.current = active?.title ?? (fileMeta ? "YOUR MOVIE\nIS ON THE *TABLE*" : "THIS IS HOW\nA QUIET SCENE *TURNS*");
	(0, import_react.useEffect)(() => {
		hasMovieHandle().then(setRemembered);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!fileMeta) return;
		saveProject({
			name: fileMeta.name,
			size: fileMeta.size,
			cuts,
			cues,
			srtName: srtName ?? void 0
		});
	}, [
		fileMeta,
		cuts,
		cues,
		srtName
	]);
	(0, import_react.useEffect)(() => {
		const bed = bedRef.current ?? new Audio();
		bed.loop = true;
		bed.volume = BED_VOLUME;
		bedRef.current = bed;
		const src = bedSrc(active?.category);
		if (!bed.src.endsWith(src)) bed.src = src;
		if (playing && status !== "scanning" && !recording) bed.play().catch(() => void 0);
		else bed.pause();
	}, [
		playing,
		recording,
		status,
		active?.category
	]);
	(0, import_react.useEffect)(() => {
		const kick = () => {
			const bed = bedRef.current;
			if (!bed || recordingRef.current) return;
			if (playingRef.current || demoPlayingRef.current) bed.play().catch(() => void 0);
		};
		window.addEventListener("pointerdown", kick);
		return () => window.removeEventListener("pointerdown", kick);
	}, []);
	(0, import_react.useEffect)(() => {
		setLineDraft("");
	}, [activeId]);
	(0, import_react.useEffect)(() => {
		const video = videoRef.current;
		if (!video) return;
		const onPlay = () => {
			playingRef.current = true;
			setPlaying(true);
		};
		const onPause = () => {
			playingRef.current = false;
			setPlaying(false);
		};
		video.addEventListener("play", onPlay);
		video.addEventListener("pause", onPause);
		return () => {
			video.removeEventListener("play", onPlay);
			video.removeEventListener("pause", onPause);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		let raf = 0;
		let last = performance.now();
		let demoElapsed = 0;
		let acc = 0;
		const loop = (ts) => {
			const dt = Math.min(.05, (ts - last) / 1e3);
			last = ts;
			const video = videoRef.current;
			const film = !demoModeRef.current && !!video && video.readyState >= 2 && video.videoWidth > 0;
			if (!film && demoPlayingRef.current) demoElapsed += dt;
			const time = film && video ? video.currentTime : demoElapsed % DEMO_LOOP;
			if (film && video && playingRef.current) {
				const cut = activeCutRef.current;
				if (cut && video.currentTime >= cut.end - .04) video.pause();
			}
			acc += dt;
			if (acc > .08) {
				acc = 0;
				setNow(time);
				setDemoStill(Math.floor(demoElapsed / DEMO_LOOP) % 2);
				const phrase = phraseAt(film ? phrasesRef.current : DEMO_PHRASES, time);
				setLiveLine(phrase ? phrase.words.map((w) => w.text).join(" ") : "");
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.code !== "Space") return;
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			e.preventDefault();
			toggleRef.current();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	toggleRef.current = () => {
		const video = videoRef.current;
		if (!fileMeta || !video || demoModeRef.current) {
			demoPlayingRef.current = !demoPlayingRef.current;
			setPlaying(demoPlayingRef.current);
			return;
		}
		if (!video.paused) {
			video.pause();
			return;
		}
		const cut = activeCutRef.current;
		if (cut && (video.currentTime < cut.start - .05 || video.currentTime >= cut.end - .12)) video.currentTime = cut.start;
		video.play().catch(() => setError("Press play again to start the sound."));
	};
	function resetHearing() {
		hearGenRef.current += 1;
		queueRef.current = [];
		inflightRef.current = null;
		heardWindowRef.current = /* @__PURE__ */ new Map();
		manualLockRef.current = false;
		setHearingId(null);
		setSilentIds([]);
		setHearError(null);
	}
	function enqueueKaraoke(list, firstId) {
		if (manualLockRef.current || !fileRef.current) return;
		const pending = list.filter((cut) => heardWindowRef.current.get(cut.id) !== windowKey(cut) && inflightRef.current !== cut.id);
		const extras = queueRef.current.filter((cut) => !pending.some((item) => item.id === cut.id) && heardWindowRef.current.get(cut.id) !== windowKey(cut) && inflightRef.current !== cut.id);
		const merged = [...pending, ...extras];
		merged.sort((a, b) => a.id === firstId ? -1 : b.id === firstId ? 1 : 0);
		queueRef.current = merged;
		pumpRef.current();
	}
	pumpRef.current = () => {
		(async () => {
			if (pumpingRef.current) return;
			pumpingRef.current = true;
			const gen = hearGenRef.current;
			let failures = 0;
			try {
				while (queueRef.current.length && hearGenRef.current === gen && !manualLockRef.current) {
					const cut = queueRef.current.shift();
					if (!cut) break;
					const key = windowKey(cut);
					if (heardWindowRef.current.get(cut.id) === key) continue;
					const file = fileRef.current;
					if (!file) break;
					inflightRef.current = cut.id;
					setHearingId(cut.id);
					setHearError(null);
					try {
						const wav = await extractCutWav(file, cut.start, cut.end, () => hearGenRef.current !== gen);
						if (hearGenRef.current !== gen) return;
						const relative = await transcribeWav(wav);
						if (hearGenRef.current !== gen) return;
						const live = cutsRef.current.find((item) => item.id === cut.id);
						if (!live || windowKey(live) !== key) {
							if (live) queueRef.current.unshift(live);
							continue;
						}
						const made = wordsToCues(relative.map((word) => ({
							text: word.text,
							start: cut.start + word.start,
							end: Math.min(cut.end, cut.start + word.end)
						})).filter((word) => word.end > word.start + .03), cut.id);
						heardWindowRef.current.set(cut.id, key);
						failures = 0;
						if (!made.length) setSilentIds((prev) => prev.includes(cut.id) ? prev : [...prev, cut.id]);
						else {
							setSilentIds((prev) => prev.filter((id) => id !== cut.id));
							const prevCues = cuesRef.current;
							if (!prevCues.some((cue) => cue.source !== "heard" && cue.end > cut.start + .3 && cue.start < cut.end - .3) && !manualLockRef.current) {
								const next = [...prevCues.filter((cue) => !(cue.source === "heard" && cue.cutId === cut.id)), ...made].sort((a, b) => a.start - b.start);
								cuesRef.current = next;
								setCues(next);
							}
							setSrtName((name) => isUploadedSubs(name) ? name : "Heard from the cut");
						}
					} catch (err) {
						if (err instanceof Error && err.message === "stale") return;
						const live = cutsRef.current.find((item) => item.id === cut.id);
						if (!live || windowKey(live) !== key) {
							if (live) queueRef.current.unshift(live);
							continue;
						}
						failures += 1;
						heardWindowRef.current.set(cut.id, key);
						setHearError(err instanceof Error ? err.message : "Karaoke couldn't be written.");
						if (failures >= 2) {
							queueRef.current = [];
							break;
						}
					} finally {
						if (inflightRef.current === cut.id) inflightRef.current = null;
					}
				}
			} finally {
				pumpingRef.current = false;
				setHearingId(null);
				if (queueRef.current.length && !manualLockRef.current) pumpRef.current();
			}
		})();
	};
	(0, import_react.useEffect)(() => {
		if (status !== "ready" || !fileMeta || !cuts.length) return;
		const timer = window.setTimeout(() => enqueueKaraoke(cuts, activeId), 500);
		return () => window.clearTimeout(timer);
	}, [
		status,
		fileMeta,
		cuts,
		activeId
	]);
	async function openFile(file) {
		const video = videoRef.current;
		if (!video) return;
		setError(null);
		setStatus("loading");
		statusRef.current = "loading";
		const url = URL.createObjectURL(file);
		const previousUrl = video.getAttribute("data-object-url");
		if (previousUrl) URL.revokeObjectURL(previousUrl);
		video.setAttribute("data-object-url", url);
		video.src = url;
		video.load();
		try {
			await new Promise((resolve, reject) => {
				const ok = () => {
					cleanup();
					resolve();
				};
				const bad = () => {
					cleanup();
					reject(/* @__PURE__ */ new Error("This browser couldn't play that file. MP4 and WebM work best."));
				};
				const cleanup = () => {
					video.removeEventListener("loadedmetadata", ok);
					video.removeEventListener("error", bad);
				};
				if (video.readyState >= 1 && Number.isFinite(video.duration)) {
					resolve();
					return;
				}
				video.addEventListener("loadedmetadata", ok);
				video.addEventListener("error", bad);
			});
		} catch (err) {
			setStatus(fileRef.current ? "ready" : "empty");
			setError(err instanceof Error ? err.message : "Could not open that movie.");
			return;
		}
		const meta = {
			name: file.name,
			size: file.size,
			duration: video.duration,
			width: video.videoWidth,
			height: video.videoHeight
		};
		const previous = fileRef.current;
		const switching = previous != null && (previous.name !== file.name || previous.size !== file.size);
		fileRef.current = file;
		demoModeRef.current = false;
		demoPlayingRef.current = false;
		video.pause();
		setPlaying(false);
		resetHearing();
		setFileMeta(meta);
		samplesRef.current = null;
		setCanRerank(false);
		if (switching) {
			setCues([]);
			setSrtName(null);
		}
		const saved = loadProject();
		if (saved && saved.name === file.name && saved.size === file.size) {
			setCuts(saved.cuts);
			setActiveId(saved.cuts[0]?.id ?? null);
			if (saved.cues?.length) {
				setCues(saved.cues);
				setSrtName(saved.srtName ?? null);
				setSignalList(signalsFrom(false, true));
				const uploaded = isUploadedSubs(saved.srtName) || saved.cues.some((cue) => cue.source === "file");
				const onlyHeard = saved.cues.every((cue) => cue.source === "heard");
				if (uploaded || !onlyHeard) manualLockRef.current = true;
				if (onlyHeard) for (const cue of saved.cues) {
					const cut = cue.cutId ? saved.cuts.find((item) => item.id === cue.cutId) : void 0;
					if (cut) heardWindowRef.current.set(cut.id, windowKey(cut));
				}
			} else if (switching) setSignalList(["Picture energy"]);
		} else {
			setCuts([]);
			setActiveId(null);
			if (switching) setSignalList(["Picture energy"]);
		}
		setStatus("ready");
	}
	async function chooseMovie() {
		setError(null);
		const picker = window.showOpenFilePicker;
		if (picker) try {
			const [handle] = await picker({
				multiple: false,
				types: [{
					description: "Movie",
					accept: { "video/*": [
						".mp4",
						".mov",
						".m4v",
						".webm",
						".mkv"
					] }
				}]
			});
			await saveMovieHandle(handle).catch(() => void 0);
			setRemembered(true);
			await openFile(await handle.getFile());
			return;
		} catch (err) {
			if (err instanceof DOMException && err.name === "AbortError") return;
		}
		movieInputRef.current?.click();
	}
	async function openMagnet() {
		const link = parseMagnet(magnet);
		if (!link) {
			setError("Paste a full magnet link, starting with magnet:?");
			return;
		}
		magnetAbortRef.current?.abort();
		const ac = new AbortController();
		magnetAbortRef.current = ac;
		setFetching(true);
		setError(null);
		setProgress(0);
		setProgressLabel("Looking for peers");
		try {
			await openFile(await fileFromMagnet(link, (ratio, label) => {
				setProgress(ratio);
				setProgressLabel(label);
			}, ac.signal));
		} catch (err) {
			if (err instanceof DOMException && err.name === "AbortError") return;
			setStatus(fileRef.current ? "ready" : "empty");
			statusRef.current = fileRef.current ? "ready" : "empty";
			setError(err instanceof Error ? err.message : "The magnet couldn't be opened.");
		} finally {
			setFetching(false);
			magnetAbortRef.current = null;
		}
	}
	async function reopenRemembered() {
		try {
			const handle = await loadMovieHandle();
			if (!handle) {
				setRemembered(false);
				return;
			}
			let perm = await handle.queryPermission?.({ mode: "read" }) ?? "prompt";
			if (perm !== "granted") perm = await handle.requestPermission?.({ mode: "read" }) ?? "denied";
			if (perm !== "granted") {
				setError("Allow Hookcut to read that movie again, or open it with the button.");
				return;
			}
			await openFile(await handle.getFile());
		} catch {
			setError("The remembered movie isn't available. Open it from this device again.");
		}
	}
	async function openSubs(file) {
		const parsed = parseSubtitles(await file.text());
		if (!parsed.length) {
			setError("That subtitle file didn't contain any timed lines.");
			return;
		}
		setError(null);
		setCues(parsed);
		setSrtName(file.name);
		manualLockRef.current = true;
		hearGenRef.current += 1;
		queueRef.current = [];
		setHearingId(null);
		setSignalList(signalsFrom(usedAudioRef.current, true));
	}
	async function scan() {
		const video = videoRef.current;
		const file = fileRef.current;
		if (!video || !file || !fileMeta) return;
		if (fileMeta.duration < 50) {
			setError("This file is shorter than 50 seconds, so it can't hold a portrait cut.");
			return;
		}
		const ac = new AbortController();
		abortRef.current = ac;
		setStatus("scanning");
		setError(null);
		setProgress(0);
		setProgressLabel("Starting at the top of the film");
		const prevMute = video.muted;
		video.muted = true;
		video.pause();
		try {
			const result = await analyzeMovie({
				video,
				file,
				duration: fileMeta.duration,
				cues: cuesRef.current,
				signal: ac.signal,
				onProgress: (ratio, label) => {
					setProgress(ratio);
					setProgressLabel(label);
				}
			});
			samplesRef.current = result.samples;
			usedAudioRef.current = result.usedAudio;
			let cuts = result.cuts;
			let readScenes = false;
			if (result.shots.length >= 2 && !ac.signal.aborted) {
				setProgress(.98);
				setProgressLabel("Reading the openings");
				try {
					const judged = await judgeMoments({ data: { moments: result.shots.map((shot) => ({
						id: shot.id,
						start: shot.start,
						end: shot.end,
						category: shot.category,
						score: shot.score,
						quote: shot.quote ?? "",
						lines: shot.lines,
						openLine: shot.openLine,
						motion: shot.motion,
						contrast: shot.contrast,
						lum: shot.lum,
						audio: shot.audio,
						image: shot.image
					})) } });
					if (judged.ok && judged.cuts.length) {
						cuts = cutsFromJudgement(result.cuts, result.shots, judged.cuts);
						readScenes = true;
					}
				} catch {}
			}
			setCuts(cuts);
			setActiveId(cuts[0]?.id ?? null);
			if (!manualLockRef.current) {
				heardWindowRef.current = /* @__PURE__ */ new Map();
				setSilentIds([]);
				setCues((prev) => prev.filter((cue) => cue.source !== "heard"));
			}
			const signals = signalsFrom(result.usedAudio, cues.length > 0 || !manualLockRef.current);
			if (readScenes) signals.push("Scene read");
			setSignalList(signals);
			setCanRerank(true);
			if (!cuts.length) setError("No 50–59 second cut fit inside this file.");
			if (cuts[0]) video.currentTime = cuts[0].start;
			setStatus("ready");
		} catch (err) {
			if (!(err instanceof DOMException && err.name === "AbortError")) setError(err instanceof Error ? err.message : "The scan stopped.");
			setStatus(fileMeta ? "ready" : "empty");
		} finally {
			video.muted = prevMute;
			abortRef.current = null;
		}
	}
	async function rerank() {
		const video = videoRef.current;
		if (!samplesRef.current || !fileMeta || !video) return;
		setError(null);
		const next = pickCuts(samplesRef.current, fileMeta.duration, cues, usedAudioRef.current);
		const withThumbs = await refreshThumbs(video, next);
		setCuts(withThumbs);
		setActiveId(withThumbs[0]?.id ?? null);
		setSignalList(signalsFrom(usedAudioRef.current, cues.length > 0));
		if (!next.length) setError("Those lines didn't leave a 50–59 second cut.");
	}
	function patchCut(id, partial) {
		setCuts((prev) => prev.map((c) => c.id === id ? {
			...c,
			...partial
		} : c));
	}
	function moveStart(start) {
		if (!active || !fileMeta) return;
		const len = Math.min(59, Math.max(50, active.end - active.start));
		let s = start;
		if (s + len > fileMeta.duration) s = Math.max(0, fileMeta.duration - len);
		patchCut(active.id, {
			start: round2(s),
			end: round2(Math.min(fileMeta.duration, s + len))
		});
	}
	function moveLen(len) {
		if (!active || !fileMeta) return;
		let end = active.start + len;
		let start = active.start;
		if (end > fileMeta.duration) {
			end = fileMeta.duration;
			start = Math.max(0, end - len);
		}
		patchCut(active.id, {
			start: round2(start),
			end: round2(end)
		});
	}
	function applyLines() {
		if (!active) return;
		const made = linesToCues(lineDraft.split("\n"), active.start, active.end);
		if (!made.length) {
			setError("Add one spoken line per row.");
			return;
		}
		setError(null);
		setCues((prev) => {
			const next = [...prev.filter((c) => c.end <= active.start + .05 || c.start >= active.end - .05), ...made].sort((a, b) => a.start - b.start);
			cuesRef.current = next;
			return next;
		});
		setSrtName((name) => name ?? "Pasted lines");
		heardWindowRef.current.set(active.id, windowKey(active));
	}
	async function recordCut() {
		const video = videoRef.current;
		const cut = activeCutRef.current;
		if (!video || !cut || recording) return;
		if (cut.end - cut.start < 49.5) {
			setError("Save is for a 50–59 second cut.");
			return;
		}
		if (!manualLockRef.current && heardWindowRef.current.get(cut.id) !== windowKey(cut)) {
			if (!cuesRef.current.some((cue) => cue.source !== "heard" && cue.end > cut.start + .3 && cue.start < cut.end - .3)) {
				setHearError(null);
				enqueueKaraoke([cut], cut.id);
				const started = Date.now();
				while (heardWindowRef.current.get(cut.id) !== windowKey(cut) && Date.now() - started < 75e3) await new Promise((resolve) => window.setTimeout(resolve, 150));
			}
		}
		const mime = [
			"video/webm;codecs=vp8,opus",
			"video/webm;codecs=vp9,opus",
			"video/webm"
		].find((t) => MediaRecorder.isTypeSupported(t));
		if (!mime) {
			setError("This browser can't write a downloadable cut. Playback still works.");
			return;
		}
		recordingRef.current = true;
		setRecording(true);
		setError(null);
		video.pause();
		bedRef.current?.pause();
		try {
			await seekTo(video, cut.start);
		} catch {
			setRecording(false);
			recordingRef.current = false;
			setError("Couldn't move to the start of this cut.");
			return;
		}
		const canvas = document.createElement("canvas");
		canvas.width = 720;
		canvas.height = 1280;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			setRecording(false);
			recordingRef.current = false;
			setError("Couldn't prepare the cut.");
			return;
		}
		const canvasStream = canvas.captureStream(30);
		let mix = null;
		const stopMix = () => {
			mix?.el.pause();
			mix?.ctx.close().catch(() => void 0);
			mix = null;
		};
		try {
			const AudioCtx = window.AudioContext;
			if (AudioCtx) {
				const audioCtx = new AudioCtx();
				const dest = audioCtx.createMediaStreamDestination();
				const movieTracks = (video.captureStream?.())?.getAudioTracks() ?? [];
				if (movieTracks.length) audioCtx.createMediaStreamSource(new MediaStream(movieTracks)).connect(dest);
				const el = new Audio(bedSrc(cut.category));
				el.loop = true;
				const source = audioCtx.createMediaElementSource(el);
				const gain = audioCtx.createGain();
				gain.gain.value = BED_VOLUME;
				source.connect(gain);
				gain.connect(dest);
				gain.connect(audioCtx.destination);
				await el.play();
				for (const track of dest.stream.getAudioTracks()) canvasStream.addTrack(track);
				mix = {
					ctx: audioCtx,
					el
				};
			}
		} catch {
			try {
				const videoStream = video.captureStream?.();
				if (videoStream) for (const track of videoStream.getAudioTracks()) canvasStream.addTrack(track);
			} catch {}
		}
		const rec = new MediaRecorder(canvasStream, {
			mimeType: mime,
			videoBitsPerSecond: 4e6
		});
		const chunks = [];
		rec.ondataavailable = (e) => {
			if (e.data.size) chunks.push(e.data);
		};
		const stopped = new Promise((resolve) => {
			rec.onstop = () => resolve();
		});
		rec.start(250);
		const paint = window.setInterval(() => {
			const phrase = phraseAt(cuesToPhrases(cuesRef.current), video.currentTime);
			const hot = phrase ? wordIndexAt(phrase, video.currentTime) : -1;
			drawStage(ctx, canvas.width, canvas.height, video, parseTitle(cut.title), phrase ? {
				words: phrase.words.map((w, i) => ({
					text: w.text,
					hot: i === hot
				})),
				alpha: 1
			} : null);
		}, 1e3 / 30);
		try {
			await video.play();
		} catch {
			window.clearInterval(paint);
			stopMix();
			rec.stop();
			setRecording(false);
			recordingRef.current = false;
			setError("Playback has to start before a cut can be saved.");
			return;
		}
		await new Promise((resolve) => {
			const killer = window.setTimeout(() => {
				window.clearInterval(watch);
				window.clearInterval(paint);
				if (rec.state !== "inactive") rec.stop();
				resolve();
			}, (cut.end - cut.start + 8) * 1e3);
			const watch = window.setInterval(() => {
				if (video.currentTime >= cut.end - .05) {
					window.clearTimeout(killer);
					window.clearInterval(watch);
					window.clearInterval(paint);
					video.pause();
					if (rec.state !== "inactive") rec.stop();
					resolve();
				}
			}, 120);
		});
		await stopped;
		stopMix();
		const blob = new Blob(chunks, { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `hookcut-${cut.category}-${Math.round(cut.start)}s.webm`;
		a.click();
		window.setTimeout(() => URL.revokeObjectURL(url), 4e3);
		setRecording(false);
	}
	function onDrop(e) {
		e.preventDefault();
		setDragOver(false);
		const files = [...e.dataTransfer.files];
		const movie = files.find((f) => f.type.startsWith("video/") || /\.(mp4|mov|webm|mkv|m4v)$/i.test(f.name));
		const sub = files.find((f) => /\.(srt|vtt)$/i.test(f.name));
		if (movie) openFile(movie);
		if (sub) openSubs(sub);
	}
	const cutLen = active ? active.end - active.start : 0;
	const titleSrc = status === "scanning" ? "FINDING\nFIVE *CUTS*" : titleRef.current;
	const titleLines = parseTitle(titleSrc);
	(0, import_react.useEffect)(() => {
		const measure = () => {
			const box = titleFitRef.current;
			if (!box) return;
			const avail = box.clientWidth;
			let widest = 0;
			box.querySelectorAll("p").forEach((line) => {
				widest = Math.max(widest, line.scrollWidth);
			});
			setTitleScale(widest > 0 ? Math.min(1.7, Math.max(.62, (avail - 10) / widest)) : 1);
		};
		measure();
		document.fonts?.ready.then(measure);
	}, [titleSrc]);
	const shown = phraseAt(fileMeta ? phrases : DEMO_PHRASES, now);
	const hotWord = shown ? wordIndexAt(shown, now) : -1;
	const stillSrc = demoStill === 0 ? "/still-ticket.jpg" : "/still-booth.jpg";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-screen w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-poster text-4xl tracking-wide text-fg",
					children: "HOOKCUT"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Portrait cuts from the movie on this device"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hidden text-right text-sm text-muted sm:block",
					children: "50–59 seconds · nothing uploaded"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "order-2 min-w-0 lg:order-1",
					onDragOver: (e) => {
						e.preventDefault();
						setDragOver(true);
					},
					onDragLeave: () => setDragOver(false),
					onDrop,
					children: !fileMeta ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `rounded-3xl bg-surface p-5 ring-1 sm:p-7 ${dragOver ? "ring-pop" : "ring-line"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "font-poster text-4xl leading-none tracking-wide text-fg sm:text-5xl",
								children: [
									"FIVE SCENES.",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									"THE LINE IN THE MIDDLE."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 max-w-xl text-base leading-relaxed text-muted",
								children: "Open a full movie from this device. Hookcut marks up to five stretches between 50 and 59 seconds — an epic turn, a joke, a line people repeat, a lesson, action, revenge. Each one plays tall, with a hook across the top and cutout karaoke in the center that disappears when the line is done."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
								className: "mt-5 grid gap-2 text-sm text-fg",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "1. Open the movie. The picture stays in this browser." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "2. Find the cuts. Karaoke is written from the dialogue." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "3. Play or save. Each line leaves when it ends." })
								]
							}),
							srtName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 text-sm text-pop",
								children: [
									"Subtitles ready · ",
									srtName,
									". They stay with the movie you open next."
								]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex flex-wrap gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: () => void chooseMovie(),
										disabled: status === "loading",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {
											"aria-hidden": "true",
											className: "size-4"
										}), status === "loading" ? "Reading the movie" : "Open a movie"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "quiet",
										onClick: () => srtInputRef.current?.click(),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Captions, {
											"aria-hidden": "true",
											className: "size-4"
										}), "Add subtitles"]
									}),
									remembered ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										onClick: () => void reopenRemembered(),
										children: "Reopen the last movie"
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MagnetBar, {
								value: magnet,
								fetching,
								progress,
								label: progressLabel,
								disabled: status === "loading" || status === "scanning",
								onChange: setMagnet,
								onSubmit: () => void openMagnet(),
								onStop: () => magnetAbortRef.current?.abort()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-8 grid gap-2",
								children: CATEGORY_ORDER.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-pop",
										children: CATEGORY_LABEL[cat]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted",
										children: [" — ", BLURB[cat]]
									})]
								}, cat))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-6 text-sm leading-relaxed text-muted",
								children: "Ranking keeps a cut only when the first 3 to 5 seconds can stop a scroll. Epic, comedy, dialogue, a lesson, action, or revenge is used when the scene is actually that — never to fill a slot."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: "You need the rights to the film, including a magnet. The picture stays here. About a minute of each cut's audio is sent so the karaoke can be written."
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `rounded-3xl bg-surface p-4 ring-1 sm:p-5 ${dragOver ? "ring-pop" : "ring-line"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate font-medium text-fg",
										children: fileMeta.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-sm tabular-nums text-muted",
										children: [
											formatBytes(fileMeta.size),
											" · ",
											formatTimecode(fileMeta.duration),
											" · ",
											fileMeta.width,
											"×",
											fileMeta.height,
											srtName ? ` · ${srtName}` : ""
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 flex flex-wrap gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												onClick: () => void scan(),
												disabled: status === "scanning" || status === "loading" || !longEnough,
												children: status === "scanning" ? "Reading the film" : "Find five cuts"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "quiet",
												onClick: () => void chooseMovie(),
												disabled: status === "scanning",
												children: "Change movie"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "quiet",
												onClick: () => srtInputRef.current?.click(),
												disabled: status === "scanning",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Captions, {
													"aria-hidden": "true",
													className: "size-4"
												}), srtName ? "Replace subtitles" : "Add subtitles"]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MagnetBar, {
										value: magnet,
										fetching,
										progress,
										label: progressLabel,
										disabled: status === "loading" || status === "scanning",
										onChange: setMagnet,
										onSubmit: () => void openMagnet(),
										onStop: () => magnetAbortRef.current?.abort()
									}),
									status === "scanning" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-3 text-sm text-muted",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: progressLabel }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "tabular-nums",
													children: [Math.round(progress * 100), "%"]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "h-full bg-pop",
													style: { width: `${Math.round(progress * 100)}%` }
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												className: "mt-3",
												variant: "ghost",
												onClick: () => abortRef.current?.abort(),
												children: "Stop"
											})
										]
									}) : null,
									!longEnough ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-sm text-muted",
										children: "Portrait cuts are 50 to 59 seconds. This file is shorter than that."
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-3 text-sm text-muted",
										children: [
											"A feature-length film takes a short while. Hookcut seeks through it here.",
											fileMeta.size > 18874368 ? " Sound peaks are skipped on large files." : "",
											" After the cuts land, karaoke is written from each one's dialogue."
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-3 flex flex-wrap gap-2",
										children: signalList.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-full bg-surface-2 px-3 py-1 text-xs text-fg",
											children: s
										}, s))
									})
								]
							}),
							error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								role: "alert",
								className: "rounded-2xl bg-surface px-4 py-3 text-sm text-fg ring-1 ring-line",
								children: error
							}) : null,
							cuts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-2",
								children: cuts.map((cut, index) => {
									const selected = cut.id === activeId;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										"aria-pressed": selected,
										onClick: () => {
											setActiveId(cut.id);
											const video = videoRef.current;
											if (video) {
												video.pause();
												video.currentTime = cut.start;
											}
										},
										className: `flex w-full gap-3 rounded-2xl bg-surface p-3 text-left ring-1 ${selected ? "ring-pop" : "ring-line"}`,
										children: [cut.thumb ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: cut.thumb,
											alt: "",
											className: "h-16 w-28 shrink-0 rounded-lg object-cover"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-surface-2 font-poster text-2xl text-pop",
											children: index + 1
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "block text-xs text-pop",
													children: CATEGORY_LABEL[cut.category]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mt-1 block font-poster text-xl leading-none tracking-wide text-fg",
													children: plainTitle(cut.title)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "mt-1 block text-sm tabular-nums text-muted",
													children: [
														formatTimecode(cut.start),
														" – ",
														formatTimecode(cut.end),
														" · ",
														formatSeconds(cut.end - cut.start)
													]
												})
											]
										})]
									}, cut.id);
								})
							}) : status !== "scanning" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "No cuts yet. Find them after the movie is open."
							}) : null,
							cuts.length > 0 && cuts.length < 5 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									"This file can hold ",
									cuts.length,
									" ",
									cuts.length === 1 ? "cut" : "cuts",
									" of 50–59 seconds. A full movie yields five."
								]
							}) : null,
							active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 rounded-3xl bg-surface p-4 ring-1 ring-line sm:p-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-pop",
											children: CATEGORY_LABEL[active.category]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "mt-1 font-poster text-3xl leading-none tracking-wide text-fg",
											children: plainTitle(active.title)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-sm leading-relaxed text-muted",
											children: active.reason
										}),
										active.quote ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-2 text-sm text-fg",
											children: [
												"“",
												active.quote,
												"”"
											]
										}) : null
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "grid gap-2 text-sm text-muted",
										children: [
											"Hook title",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
												rows: 2,
												value: active.title,
												maxLength: 90,
												onChange: (e) => patchCut(active.id, { title: e.target.value.toUpperCase() }),
												className: "rounded-2xl bg-bg px-3 py-3 font-poster text-xl tracking-wide text-fg ring-1 ring-line outline-none focus:ring-pop"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Put *asterisks* around the word that should turn yellow." })
										]
									}),
									longEnough ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "grid gap-2 text-sm text-muted",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex justify-between",
												children: ["Starts at ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "tabular-nums text-fg",
													children: formatTimecode(active.start)
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "range",
												min: 0,
												max: Math.max(0, fileMeta.duration - 50),
												step: 1,
												value: Math.min(active.start, Math.max(0, fileMeta.duration - 50)),
												onChange: (e) => moveStart(Number(e.target.value)),
												className: "accent-pop"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "grid gap-2 text-sm text-muted",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex justify-between",
												children: ["Length ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "tabular-nums text-fg",
													children: formatSeconds(cutLen)
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "range",
												min: 50,
												max: 59,
												step: 1,
												value: Math.round(Math.min(59, Math.max(50, cutLen))),
												onChange: (e) => moveLen(Number(e.target.value)),
												className: "accent-pop"
											})]
										})]
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "grid gap-2 text-sm text-muted",
										children: ["Lines for this cut", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											rows: 4,
											value: lineDraft,
											onChange: (e) => setLineDraft(e.target.value),
											placeholder: "One spoken line per row\nThey play in order and then leave",
											className: "rounded-2xl bg-bg px-3 py-3 text-sm text-fg ring-1 ring-line outline-none focus:ring-pop"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "quiet",
											onClick: applyLines,
											children: "Time these lines"
										}), canRerank ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "quiet",
											onClick: () => void rerank(),
											children: "Rank again with these lines"
										}) : null]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted",
										children: hearingId ? "Writing cutout karaoke from the dialogue…" : hearError ? hearError : active && silentIds.includes(active.id) && !cues.some((cue) => cue.cutId === active.id) ? "No spoken lines in this cut. Paste them if you still want words." : cues.some((cue) => cue.source === "heard") ? "Cutout karaoke is already on the cuts. Each line leaves when it ends." : cues.length ? `${cues.length} timed lines loaded. Karaoke follows them and clears when each phrase ends.` : "Karaoke writes itself once the cuts are in. An .srt is optional."
									})
								]
							}) : null
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "order-1 lg:order-2 lg:sticky lg:top-4",
					children: [
						!fileMeta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-3 flex justify-center lg:hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => void chooseMovie(),
								disabled: status === "loading",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {
									"aria-hidden": "true",
									className: "size-4"
								}), status === "loading" ? "Reading the movie" : "Open a movie"]
							})
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "stage-frame relative mx-auto overflow-hidden rounded-3xl bg-black ring-1 ring-line",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative flex h-full flex-col",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-[0.85]" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											ref: titleFitRef,
											className: "w-full overflow-hidden px-1 pb-1.5",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "origin-center text-center",
												style: { transform: `scale(${titleScale})` },
												children: titleLines.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-poster text-[2.15rem] leading-[0.9] tracking-wide whitespace-nowrap text-fg sm:text-[2.85rem]",
													children: line.map((word, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: word.hot ? "text-pop" : "text-fg",
														children: [word.text, " "]
													}, j))
												}, i))
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative aspect-video w-full shrink-0 overflow-hidden bg-black",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
													ref: videoRef,
													playsInline: true,
													preload: "metadata",
													className: `h-full w-full object-cover ${fileMeta ? "" : "pointer-events-none opacity-0"}`
												}),
												!fileMeta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: stillSrc,
													alt: "",
													className: "absolute inset-0 h-full w-full object-cover"
												}) : null,
												!playing && !recording ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "pointer-events-none absolute inset-0 z-10 flex items-center justify-center",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "flex size-14 items-center justify-center rounded-full bg-pop text-ink",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
															"aria-hidden": "true",
															className: "size-6"
														})
													})
												}) : null
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: `flex flex-[1.1] items-start justify-center px-3 pt-4 text-center transition-opacity duration-150 ${shown ? "opacity-100" : "opacity-0"}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-2xl leading-tight font-extrabold sm:text-3xl",
												children: shown ? shown.words.map((word, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: i === hotWord ? "karaoke-cut is-hot" : "karaoke-cut",
													children: [word.text, " "]
												}, `${shown.id}-${i}`)) : null
											})
										})
									]
								}),
								!recording ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "absolute inset-0 z-10",
									"aria-label": playing ? "Pause the portrait" : "Play the portrait",
									onClick: () => toggleRef.current()
								}) : null,
								hearingId && fileMeta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "pointer-events-none absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full bg-bg/80 px-3 py-1 text-xs text-fg ring-1 ring-line",
									children: "Writing karaoke"
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "sr-only",
							"aria-live": "polite",
							children: liveLine
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-center text-sm text-muted",
							children: fileMeta && active ? `${formatTimecode(active.start)} – ${formatTimecode(active.end)} · ${formatSeconds(active.end - active.start)}` : fileMeta ? formatTimecode(fileMeta.duration) : "Style preview — open your movie for real cuts"
						}),
						fileMeta && active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center font-poster text-3xl tabular-nums tracking-wide text-fg",
							children: formatTimecode(Math.max(0, Math.min(cutLen, now - active.start)))
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto mt-3 flex w-full max-w-md flex-wrap items-center justify-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "quiet",
									onClick: () => toggleRef.current(),
									disabled: recording,
									children: [playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
										className: "size-4",
										"aria-hidden": "true"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
										className: "size-4",
										"aria-hidden": "true"
									}), playing ? "Pause" : "Play"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "quiet",
									disabled: !active || recording,
									onClick: () => {
										const video = videoRef.current;
										if (!video || !active) return;
										video.currentTime = active.start;
										video.play().catch(() => void 0);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
										className: "size-4",
										"aria-hidden": "true"
									}), "Restart cut"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => void recordCut(),
									disabled: !active || recording || cutLen < 49.5,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
										className: "size-4",
										"aria-hidden": "true"
									}), recording ? "Saving" : "Save this cut"]
								})
							]
						}),
						recording ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-center text-sm text-muted",
							children: "Playing the cut once to write the video. Leave this tab open."
						}) : null
					]
				})]
			}),
			!fileMeta && error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "alert",
				className: "mt-4 rounded-2xl bg-surface px-4 py-3 text-sm text-fg ring-1 ring-line",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: movieInputRef,
				type: "file",
				accept: "video/*,.mp4,.mov,.webm,.mkv,.m4v",
				className: "sr-only",
				onChange: (e) => {
					const file = e.target.files?.[0];
					e.target.value = "";
					if (file) openFile(file);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: srtInputRef,
				type: "file",
				accept: ".srt,.vtt,text/vtt,application/x-subrip",
				className: "sr-only",
				onChange: (e) => {
					const file = e.target.files?.[0];
					e.target.value = "";
					if (file) openSubs(file);
				}
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, {});
}
//#endregion
export { Home as component };
