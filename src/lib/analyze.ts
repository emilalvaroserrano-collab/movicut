import type { Cue } from "@/lib/subtitles";

export type Category = "epic" | "comedy" | "dialogue" | "moral" | "action" | "revenge";

export type Sample = {
  t: number;
  diff: number;
  lum: number;
  contrast: number;
  audio: number;
};

export type Cut = {
  id: string;
  start: number;
  end: number;
  category: Category;
  score: number;
  /** AI + signal estimate of short-form retention potential, 0-100. */
  viralScore?: number;
  /** Strength of the first 3-5 seconds, 0-100. */
  hookScore?: number;
  title: string;
  reason: string;
  quote?: string;
  thumb?: string;
  /** Timestamp selected specifically for the cover/thumbnail. */
  thumbnailAt?: number;
};

export const CATEGORY_ORDER: Category[] = ["epic", "comedy", "dialogue", "moral", "action", "revenge"];

export const CATEGORY_LABEL: Record<Category, string> = {
  epic: "Epic",
  comedy: "Comedy",
  dialogue: "Dialogue",
  moral: "Moral lesson",
  action: "Action",
  revenge: "Revenge",
};

const HOOKS: Record<Category, string[]> = {
  epic: [
    "THIS IS THE MOMENT\nEVERYTHING *CHANGED*",
    "NOBODY IN THE ROOM\nWAS READY FOR *THIS*",
    "THE SCENE PEOPLE\n*PAUSE* ON",
  ],
  comedy: [
    "HE REALLY THOUGHT\nTHAT WOULD *WORK*",
    "THIS SHOULD NOT\nBE THIS *FUNNY*",
    "WATCH THE FACE\nWHEN IT *LANDS*",
  ],
  dialogue: [
    "THIS LINE\nSTILL *HITS*",
    "SAY IT AGAIN\n*SLOWER*",
    "THE LINE EVERYONE\n*REMEMBERS*",
  ],
  moral: [
    "A WHOLE LESSON\nIN ONE *SCENE*",
    "THIS IS THE PART\nYOU *KEEP*",
    "HOW YOU TREAT THEM\nIS THE *POINT*",
  ],
  action: [
    "DO NOT BLINK\nDURING *THIS*",
    "THIS IS WHERE\nIT *BREAKS*",
    "PURE MOTION\nNO *APOLOGY*",
  ],
  revenge: [
    "THE QUIETEST\n*REVENGE*",
    "THEY FORGOT\nWHO THEY *HURT*",
    "THIS IS HOW\nPAYBACK *LOOKS*",
  ],
};

const WORDS: Record<Exclude<Category, "dialogue">, string[]> = {
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
    "owe me",
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
    "be better",
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
    "laugh",
  ],
  action: ["get down", "watch out", "hurry", "fire", "look out", "come on", "go go", "shoot", "move"],
  epic: ["forever", "destiny", "together", "the world", "empire", "glory", "believe", "history", "kingdom"],
};

function avg(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = avg(xs);
  return avg(xs.map((x) => (x - m) ** 2));
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function hits(text: string, words: string[]): number {
  let n = 0;
  for (const w of words) {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(?:^|\\W)${escaped}(?:\\W|$)`, "i").test(text)) n += 1;
  }
  return Math.min(1, n / 2);
}

export function plainTitle(src: string): string {
  return src.replace(/\*/g, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

export function parseTitle(src: string): { text: string; hot: boolean }[][] {
  return src
    .split("\n")
    .slice(0, 2)
    .map((line) =>
      line
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => {
          const hot = w.length > 2 && w.startsWith("*") && w.endsWith("*");
          return { text: hot ? w.slice(1, -1) : w.replace(/\*/g, ""), hot };
        }),
    )
    .filter((line) => line.length > 0);
}

function titleFor(cat: Category, start: number): string {
  const bank = HOOKS[cat];
  const i = Math.abs(Math.round(start * 10)) % bank.length;
  return bank[i];
}

function reasonFor(cat: Category, subs: boolean, audio: boolean): string {
  const head: Record<Category, string> = {
    epic: "Big contrast and a surge that holds.",
    comedy: "A jumpy rhythm, the kind jokes live in.",
    dialogue: "The camera settles while people talk.",
    moral: "A quieter stretch with the shape of a lesson.",
    action: "The busiest frames in this part of the film.",
    revenge: "Darker pictures, the temperature of payback.",
  };
  const tail = subs
    ? "Dialogue was part of the ranking."
    : audio
      ? "Picture and sound peaks only — an .srt will sharpen this."
      : "Picture energy only — add an .srt if the label feels wrong.";
  return `${head[cat]} ${tail}`;
}

export function frameMetrics(prev: Uint8ClampedArray | null, data: Uint8ClampedArray): {
  diff: number;
  lum: number;
  contrast: number;
} {
  const n = data.length / 4;
  if (!n) return { diff: 0, lum: 0, contrast: 0 };
  let mean = 0;
  let m2 = 0;
  let diff = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const y = (data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722) / 255;
    count += 1;
    const delta = y - mean;
    mean += delta / count;
    m2 += delta * (y - mean);
    if (prev) {
      const py = (prev[i] * 0.2126 + prev[i + 1] * 0.7152 + prev[i + 2] * 0.0722) / 255;
      diff += Math.abs(y - py);
    }
  }
  return {
    lum: mean,
    contrast: Math.sqrt(m2 / count),
    diff: prev ? diff / count : 0,
  };
}

export function normalizeSamples(samples: Sample[]): Sample[] {
  if (!samples.length) return samples;
  const diffs = samples.map((s) => s.diff).sort((a, b) => a - b);
  const p95 = diffs[Math.min(diffs.length - 1, Math.floor(diffs.length * 0.95))] || 1;
  let maxAudio = 0;
  for (const s of samples) if (s.audio > maxAudio) maxAudio = s.audio;
  return samples.map((s) => ({
    ...s,
    diff: clamp01(s.diff / (p95 || 1)),
    audio: maxAudio > 0 ? s.audio / maxAudio : 0,
  }));
}

type WindowStats = {
  motion: number;
  motionVar: number;
  lum: number;
  contrast: number;
  audio: number;
  audioVar: number;
};

function windowStats(samples: Sample[], start: number, end: number): WindowStats {
  const slice = samples.filter((s) => s.t >= start && s.t < end);
  if (!slice.length) {
    return { motion: 0, motionVar: 0, lum: 0.5, contrast: 0, audio: 0, audioVar: 0 };
  }
  return {
    motion: avg(slice.map((s) => s.diff)),
    motionVar: variance(slice.map((s) => s.diff)),
    lum: avg(slice.map((s) => s.lum)),
    contrast: avg(slice.map((s) => s.contrast)),
    audio: avg(slice.map((s) => s.audio)),
    audioVar: variance(slice.map((s) => s.audio)),
  };
}

export function fitWindow(start: number, duration: number, cues: Cue[]): { start: number; end: number } {
  if (duration < 50) return { start: 0, end: round2(Math.max(0, duration)) };
  let s = Math.min(Math.max(0, start), Math.max(0, duration - 50));
  const near = cues
    .filter((c) => c.start >= s - 0.35 && c.start <= s + 2.2)
    .sort((a, b) => a.start - b.start)[0];
  if (near) s = Math.max(0, near.start - 0.1);
  if (s + 50 > duration) s = Math.max(0, duration - 54);
  let e = s + 54;
  const boundary = cues
    .filter((c) => c.end >= s + 50 && c.end <= s + 59)
    .sort((a, b) => Math.abs(a.end - (s + 54)) - Math.abs(b.end - (s + 54)))[0];
  if (boundary) e = boundary.end + 0.12;
  if (e - s < 50) e = s + 50;
  if (e - s > 59) e = s + 59;
  if (e > duration) {
    e = duration;
    s = Math.max(0, e - 54);
    if (e - s > 59) s = e - 59;
    if (e - s < 50) s = Math.max(0, e - 50);
  }
  if (e - s > 59) e = s + 59;
  return { start: round2(s), end: round2(Math.min(duration, e)) };
}

function scoreCategories(st: WindowStats, text: string, hasSubs: boolean): Record<Category, number> {
  const revenge = hits(text, WORDS.revenge);
  const moral = hits(text, WORDS.moral);
  const comedy = hits(text, WORDS.comedy) + (text.split("?").length > 2 ? 0.35 : 0);
  const actionLex = hits(text, WORDS.action);
  const epic = hits(text, WORDS.epic);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const density = Math.min(1, wordCount / 70);
  return {
    action: clamp01(st.motion * 0.72 + st.motionVar * 0.2 + actionLex * 0.6 + st.audio * 0.28),
    epic: clamp01(st.contrast * 1.3 + st.motion * 0.38 + epic * 0.55 + st.audio * 0.12),
    dialogue: clamp01((hasSubs ? density : 0) * 0.9 + (1 - st.motion) * 0.62 + (1 - Math.min(1, st.audioVar * 8)) * 0.1),
    comedy: clamp01(comedy * 0.95 + st.motionVar * 1.4 + st.audioVar * 4 + (st.lum > 0.22 && st.lum < 0.78 ? 0.08 : 0)),
    moral: clamp01(moral * 1.05 + (1 - st.motion) * 0.42 + density * 0.28 + (st.lum > 0.35 ? 0.08 : 0)),
    revenge: clamp01(revenge * 1.15 + (1 - st.lum) * 0.55 + st.motion * 0.12),
  };
}

export function bestQuote(cues: Cue[], start: number, end: number): string | null {
  let best: { text: string; score: number } | null = null;
  for (const c of cues) {
    if (c.end <= start || c.start >= end) continue;
    const text = c.text.replace(/\s+/g, " ").trim();
    const words = text.split(" ").filter(Boolean);
    if (words.length < 2 || words.length > 14) continue;
    let score = 0;
    if (words.length >= 3 && words.length <= 8) score += 2;
    if (/[!?]/.test(text)) score += 1.1;
    if (text.length <= 42) score += 0.5;
    if (/^(yeah|ok|okay|um+|uh+|hmm+)\b/i.test(text)) score -= 2;
    if (!best || score > best.score) best = { text, score };
  }
  return best && best.score > 0.4 ? best.text : null;
}

type Cand = {
  start: number;
  end: number;
  category: Category;
  score: number;
  quote: string | null;
};

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }, gap: number): boolean {
  return a.start < b.end + gap && b.start < a.end + gap;
}

function openingLine(cues: Cue[], start: number): string {
  return cues
    .filter((c) => c.end > start && c.start < start + 5)
    .map((c) => c.text.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 140);
}

function openingValue(st: WindowStats, line: string): number {
  const dead = st.lum < 0.07 || st.contrast < 0.035 ? 0.72 : 0;
  const trimmed = line.trim();
  const speech = trimmed.length > 8 ? 0.22 : 0;
  const punch = /[!?]/.test(trimmed) ? 0.12 : 0;
  const direct = /\b(you|your|why|what|how|never|stop|wait|no|don't|cant|can't|won't)\b/i.test(trimmed)
    ? 0.1
    : 0;
  const overload = st.motion > 0.92 && st.contrast < 0.08 ? 0.08 : 0;
  return clamp01(
    st.motion * 0.4 +
      st.audio * 0.24 +
      st.contrast * 0.42 +
      st.motionVar * 0.18 +
      speech +
      punch +
      direct -
      dead -
      overload,
  );
}

function placeHook(samples: Sample[], rough: number, duration: number, cues: Cue[]): { start: number; end: number } {
  const slice = samples.filter((s) => s.t >= rough - 6 && s.t <= rough + 12);
  let peakT = rough;
  let best = -Infinity;
  for (const s of slice) {
    const dead = s.lum < 0.07 || s.contrast < 0.03;
    const value = (dead ? -1.2 : 0) + s.diff * 0.7 + s.audio * 0.55 + s.contrast * 0.35;
    if (value > best) {
      best = value;
      peakT = s.t;
    }
  }
  return fitWindow(Math.max(0, peakT - 2.6), duration, cues);
}

function topCategory(scores: Record<Category, number>): { category: Category; score: number } {
  let category: Category = "dialogue";
  let score = -1;
  for (const cat of CATEGORY_ORDER) {
    if (scores[cat] > score) {
      score = scores[cat];
      category = cat;
    }
  }
  return { category, score };
}

export function pickCuts(samples: Sample[], duration: number, cues: Cue[], hasAudio: boolean): Cut[] {
  if (duration < 50 || samples.length < 2) return [];
  const lead = duration > 20 * 60 ? Math.min(150, duration * 0.02) : 0;
  const tail = duration > 20 * 60 ? Math.min(180, duration * 0.035) : 0;
  const from = Math.min(lead, Math.max(0, duration - 59));
  const to = Math.max(from, duration - tail - 50);
  const step = duration < 180 ? 4 : duration < 600 ? 8 : 12;
  const starts: number[] = [];
  for (let s = from; s <= to + 0.01; s += step) starts.push(s);
  if (!starts.length) starts.push(Math.max(0, (duration - 54) / 2));

  const hasSubs = cues.length > 0;
  const cands: Cand[] = [];

  for (const s of starts) {
    const window = placeHook(samples, s, duration, cues);
    if (window.end - window.start < 49.5) continue;
    if (tail > 0 && window.end > duration - tail + 2 && window.start > duration * 0.9) continue;
    if (cands.length && Math.abs(cands[cands.length - 1].start - window.start) < 8) continue;
    const open = windowStats(samples, window.start, window.start + 5);
    const text = cues
      .filter((c) => c.end > window.start && c.start < window.end)
      .map((c) => c.text)
      .join(" ")
      .toLowerCase();
    const scores = scoreCategories(windowStats(samples, window.start, window.end), text, hasSubs);
    const lead = topCategory(scores);
    const hook = openingValue(open, openingLine(cues, window.start));
    cands.push({
      start: window.start,
      end: window.end,
      category: lead.category,
      score: hook * 0.78 + lead.score * 0.22,
      quote: bestQuote(cues, window.start, window.end),
    });
  }

  cands.sort((a, b) => b.score - a.score);
  const capacity = Math.max(1, Math.min(5, Math.floor((duration - lead - tail) / 62)));
  const picked: Cand[] = [];
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
    score: Math.round(c.score * 1000) / 1000,
    title: titleFor(c.category, c.start),
    reason: reasonFor(c.category, hasSubs, hasAudio),
    quote: c.quote ?? undefined,
  }));
}

export type Moment = {
  id: string;
  start: number;
  end: number;
  category: Category;
  score: number;
  quote: string | null;
  motion: number;
  contrast: number;
  lum: number;
  audio: number;
  lines: string;
  openLine: string;
  frameAt: number;
  thumbnailAt: number;
};

function windowLines(cues: Cue[], start: number, end: number): string {
  return cues
    .filter((c) => c.end > start && c.start < end)
    .map((c) => c.text.replace(/\s+/g, " ").trim())
    .filter((text) => text.length > 1 && text.length < 90)
    .slice(0, 4)
    .join(" / ")
    .slice(0, 240);
}

function bestFrameAt(samples: Sample[], start: number, end: number, category: Category): Sample | null {
  const slice = samples.filter((s) => s.t >= start + 1.2 && s.t <= end - 1.2);
  const pool = slice.length ? slice : samples.filter((s) => s.t >= start && s.t < end);
  if (!pool.length) return null;
  let best = pool[0];
  let score = -Infinity;
  for (const s of pool) {
    const dead = s.lum < 0.06 || s.contrast < 0.03;
    const motionWeight = category === "action" || category === "comedy" ? 0.65 : 0.12;
    const value =
      (dead ? -2 : 0) +
      s.contrast +
      s.diff * motionWeight +
      (s.lum > 0.14 && s.lum < 0.86 ? 0.28 : 0) -
      Math.abs(s.lum - 0.45) * 0.15;
    if (value > score) {
      score = value;
      best = s;
    }
  }
  return best;
}

type Draft = {
  start: number;
  end: number;
  scores: Record<Category, number>;
  category: Category;
  motion: number;
  contrast: number;
  lum: number;
  audio: number;
  quote: string | null;
  lines: string;
  openLine: string;
  energy: number;
};

function toMoment(draft: Draft, samples: Sample[], index: number): Moment {
  const open = windowStats(samples, draft.start, draft.start + 5);
  const frame = bestFrameAt(samples, draft.start + 0.4, Math.min(draft.end, draft.start + 5), draft.category);
  const thumbnail = bestFrameAt(samples, draft.start + 0.8, draft.end - 0.8, draft.category);
  return {
    id: `m${index}`,
    start: draft.start,
    end: draft.end,
    category: draft.category,
    score: Math.round(draft.energy * 1000) / 1000,
    quote: draft.quote,
    motion: Math.round(open.motion * 100) / 100,
    contrast: Math.round(open.contrast * 100) / 100,
    lum: Math.round((frame?.lum ?? open.lum) * 100) / 100,
    audio: Math.round(open.audio * 100) / 100,
    lines: draft.lines,
    openLine: draft.openLine,
    frameAt: frame?.t ?? draft.start + 2.5,
    thumbnailAt: thumbnail?.t ?? frame?.t ?? draft.start + 2.5,
  };
}

export function spreadMoments(samples: Sample[], duration: number, cues: Cue[]): Moment[] {
  if (duration < 50 || samples.length < 2) return [];
  const lead = duration > 20 * 60 ? Math.min(150, duration * 0.02) : 0;
  const tail = duration > 20 * 60 ? Math.min(180, duration * 0.035) : 0;
  const from = Math.min(lead, Math.max(0, duration - 59));
  const to = Math.max(from, duration - tail - 50);
  const step = duration < 180 ? 6 : duration < 600 ? 10 : 16;
  const drafts: Draft[] = [];

  for (let s = from; s <= to + 0.01; s += step) {
    const window = placeHook(samples, s, duration, cues);
    if (window.end - window.start < 49.5) continue;
    if (drafts.length && Math.abs(drafts[drafts.length - 1].start - window.start) < 8) continue;
    const whole = windowStats(samples, window.start, window.end);
    const open = windowStats(samples, window.start, window.start + 5);
    const text = cues
      .filter((c) => c.end > window.start && c.start < window.end)
      .map((c) => c.text)
      .join(" ")
      .toLowerCase();
    const scores = scoreCategories(whole, text, cues.length > 0);
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
      energy: hook * 0.82 + lead.score * 0.18,
    });
  }
  if (!drafts.length) return [];

  const ranked = [...drafts].sort((a, b) => b.energy - a.energy);
  const picked: Moment[] = [];
  for (const draft of ranked) {
    if (picked.length >= 6) break;
    if (picked.some((cut) => overlaps(cut, draft, 16))) continue;
    const frame = bestFrameAt(samples, draft.start + 0.4, Math.min(draft.end, draft.start + 5), draft.category);
    if (frame && frame.lum < 0.05 && frame.contrast < 0.03 && draft.energy < 0.22) continue;
    picked.push(toMoment(draft, samples, picked.length));
  }
  if (picked.length < 4) {
    for (const draft of ranked) {
      if (picked.length >= 6) break;
      if (picked.some((cut) => Math.abs(cut.start - draft.start) < 8)) continue;
      if (picked.some((cut) => overlaps(cut, draft, 12))) continue;
      picked.push(toMoment(draft, samples, picked.length));
    }
  }

  picked.sort((a, b) => a.start - b.start);
  return picked.slice(0, 6).map((moment, index) => ({ ...moment, id: `m${index}` }));
}

export function seekTo(video: HTMLVideoElement, time: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const dur = Number.isFinite(video.duration) ? video.duration : time + 1;
    const target = Math.min(Math.max(time, 0), Math.max(dur - 0.05, 0));
    if (Math.abs(video.currentTime - target) < 0.08 && video.readyState >= 2) {
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
      reject(err instanceof Error ? err : new Error("Could not seek"));
    }
  });
}

function grabThumb(video: HTMLVideoElement): string {
  return grabFrame(video, 320, 180, 0.72);
}

function grabFrame(video: HTMLVideoElement, w: number, h: number, quality: number): string {
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

async function audioEnergy(file: File, duration: number): Promise<Float32Array | null> {
  if (file.size > 18 * 1024 * 1024 || duration > 20 * 60) return null;
  const AudioCtx = window.AudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  try {
    const buf = await ctx.decodeAudioData(await file.arrayBuffer());
    const ch = buf.getChannelData(0);
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
    await ctx.close().catch(() => undefined);
  }
}

export type MomentShot = Moment & {
  openingImage: string;
  thumbnailImage: string;
};

export async function analyzeMovie(opts: {
  video: HTMLVideoElement;
  file: File;
  duration: number;
  cues: Cue[];
  signal: AbortSignal;
  onProgress: (ratio: number, label: string) => void;
}): Promise<{ cuts: Cut[]; shots: MomentShot[]; samples: Sample[]; usedAudio: boolean }> {
  const { video, file, duration, cues, signal, onProgress } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 27;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not read frames from this movie.");

  const step = duration < 180 ? 1 : duration < 600 ? 2 : Math.max(3, duration / 240);
  const times: number[] = [];
  for (let t = 0; t < duration - 0.2; t += step) times.push(t);
  if (!times.length) times.push(0);

  const audioPromise = audioEnergy(file, duration);
  const samples: Sample[] = [];
  let prev: Uint8ClampedArray | null = null;

  for (let i = 0; i < times.length; i++) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    await seekTo(video, times[i], signal);
    ctx.drawImage(video, 0, 0, 48, 27);
    const img = ctx.getImageData(0, 0, 48, 27);
    const m = frameMetrics(prev, img.data);
    samples.push({ t: times[i], ...m, audio: 0 });
    prev = new Uint8ClampedArray(img.data);
    if (i % 2 === 0) {
      const clock = formatClock(times[i]);
      onProgress((i / times.length) * 0.84, `Reading the picture at ${clock}`);
    }
  }

  onProgress(0.86, "Listening for peaks");
  const energy = await Promise.race([
    audioPromise,
    new Promise<Float32Array | null>((resolve) => {
      window.setTimeout(() => resolve(null), 8000);
    }),
  ]);
  if (energy) {
    for (const s of samples) {
      const idx = Math.min(energy.length - 1, Math.max(0, Math.floor(s.t)));
      s.audio = energy[idx] ?? 0;
    }
  }

  onProgress(0.93, "Choosing five cuts");
  const norm = normalizeSamples(samples);
  const cuts = pickCuts(norm, duration, cues, !!energy);
  const moments = spreadMoments(norm, duration, cues);

  for (let i = 0; i < cuts.length; i++) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    await seekTo(video, Math.min(duration - 0.08, cuts[i].start + 1.25), signal);
    const thumb = grabThumb(video);
    if (thumb) cuts[i].thumb = thumb;
  }

  const shots: MomentShot[] = [];
  for (let i = 0; i < moments.length; i++) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const moment = moments[i];

    await seekTo(video, Math.min(duration - 0.08, Math.max(0, moment.frameAt)), signal);
    const openingImage = grabFrame(video, 320, 180, 0.56);

    await seekTo(video, Math.min(duration - 0.08, Math.max(0, moment.thumbnailAt)), signal);
    const thumbnailImage = grabFrame(video, 360, 203, 0.62);

    if (openingImage && thumbnailImage) shots.push({ ...moment, openingImage, thumbnailImage });
    onProgress(
      0.93 + (0.06 * (i + 1)) / Math.max(1, moments.length),
      "Choosing the strongest opening and cover frames",
    );
  }

  onProgress(1, "Cuts are ready");
  return { cuts, shots, samples: norm, usedAudio: !!energy };
}

function formatClock(t: number): string {
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export async function refreshThumbs(video: HTMLVideoElement, cuts: Cut[], signal?: AbortSignal): Promise<Cut[]> {
  const next = cuts.map((c) => ({ ...c }));
  const dur = Number.isFinite(video.duration) ? video.duration : 0;
  for (const cut of next) {
    await seekTo(video, Math.min(Math.max(dur - 0.08, 0), cut.start + 1.1), signal);
    const thumb = grabThumb(video);
    if (thumb) cut.thumb = thumb;
  }
  return next;
}
