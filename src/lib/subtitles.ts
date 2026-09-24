export type CueSource = "file" | "pasted" | "heard";

export type Cue = {
  start: number;
  end: number;
  text: string;
  source?: CueSource;
  cutId?: string;
  words?: WordSpan[];
};

export type WordSpan = { text: string; start: number; end: number };

export type Phrase = {
  id: string;
  start: number;
  end: number;
  words: WordSpan[];
};

export function parseTimestamp(raw: string): number {
  const ts = raw.trim().replace(",", ".");
  const parts = ts.split(":");
  if (parts.length === 3) {
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  }
  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  const n = Number(ts);
  return Number.isFinite(n) ? n : 0;
}

function cleanLine(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/\{[^}]+\}/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseSubtitles(input: string): Cue[] {
  const cleaned = input.replace(/^\uFEFF/, "").replace(/\r/g, "");
  const blocks = cleaned.split(/\n{2,}/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("WEBVTT") && !l.startsWith("NOTE") && !l.startsWith("STYLE") && !/^Kind:|^Language:/.test(l));
    const timing = lines.findIndex((l) => l.includes("-->"));
    if (timing === -1) continue;
    const [rawStart, rawEnd] = lines[timing].split("-->");
    if (!rawEnd) continue;
    const text = cleanLine(lines.slice(timing + 1).join(" "));
    if (!text) continue;
    const start = parseTimestamp(rawStart);
    const end = parseTimestamp(rawEnd.trim().split(/\s+/)[0] ?? "");
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    cues.push({ start, end, text, source: "file" });
  }
  cues.sort((a, b) => a.start - b.start);
  return cues;
}

function chunkWords(words: string[]): string[][] {
  if (words.length <= 5) return [words];
  const size = words.length > 8 ? 4 : 5;
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += size) chunks.push(words.slice(i, i + size));
  return chunks;
}

export function cuesToPhrases(cues: Cue[]): Phrase[] {
  const phrases: Phrase[] = [];
  cues.forEach((cue, index) => {
    if (cue.words?.length) {
      const words = cue.words.filter((w) => w.text && w.end > w.start);
      if (!words.length) return;
      phrases.push({
        id: `${index}-w`,
        start: words[0].start,
        end: Math.max(words[words.length - 1].end, words[0].start + 0.18),
        words,
      });
      return;
    }
    const raw = cue.text.split(/\s+/).filter(Boolean);
    if (raw.length === 0) return;
    const chunks = chunkWords(raw);
    const weights = chunks.map((c) => c.join("").length || 1);
    const total = weights.reduce((a, b) => a + b, 0);
    const span = Math.max(0.24, cue.end - cue.start);
    let cursor = cue.start;
    chunks.forEach((words, ci) => {
      const isLast = ci === chunks.length - 1;
      const dur = span * (weights[ci] / total);
      const start = cursor;
      const nominalEnd = isLast ? cue.end : cursor + dur;
      const end = Math.max(start + 0.18, nominalEnd - (isLast ? 0.06 : 0.1));
      cursor = isLast ? cue.end : nominalEnd;
      const ww = words.map((w) => w.length || 1);
      const wt = ww.reduce((a, b) => a + b, 0);
      let wc = start;
      const wordObjs: WordSpan[] = words.map((text, wi) => {
        const d = ((end - start) * ww[wi]) / wt;
        const ws = wc;
        const we = wi === words.length - 1 ? end : wc + d;
        wc = we;
        return { text, start: ws, end: we };
      });
      phrases.push({ id: `${index}-${ci}`, start, end, words: wordObjs });
    });
  });
  return phrases;
}

export function phraseAt(phrases: Phrase[], t: number): Phrase | null {
  for (let i = phrases.length - 1; i >= 0; i--) {
    const p = phrases[i];
    if (t >= p.start && t < p.end) return p;
  }
  return null;
}

export function wordIndexAt(phrase: Phrase, t: number): number {
  for (let i = 0; i < phrase.words.length; i++) {
    if (t < phrase.words[i].end) return i;
  }
  return Math.max(0, phrase.words.length - 1);
}

export function linesToCues(lines: string[], start: number, end: number): Cue[] {
  const usable = lines.map((l) => l.trim()).filter(Boolean);
  if (!usable.length || end <= start) return [];
  const span = (end - start) / usable.length;
  return usable.map((text, i) => {
    const cueStart = start + i * span;
    const cueEnd = i === usable.length - 1 ? end - 0.05 : cueStart + span - 0.12;
    return { start: cueStart, end: Math.max(cueStart + 0.2, cueEnd), text, source: "pasted" };
  });
}

const NOISE =
  /^(?:[\[(]?\s*(?:music|applause|laughter|silence|noise|sighs?|breathing|inaudible)\s*[\])]?|♪+|♫+)$/i;

export function wordsToCues(words: WordSpan[], cutId: string): Cue[] {
  const clean = words.filter((w) => {
    const text = w.text.trim();
    return text.length > 0 && w.end > w.start + 0.02 && !NOISE.test(text);
  });
  const groups: WordSpan[][] = [];
  let cur: WordSpan[] = [];
  for (const word of clean) {
    const prev = cur[cur.length - 1];
    const gap = prev ? word.start - prev.end : 0;
    if (cur.length && (cur.length >= 4 || gap > 0.45)) {
      groups.push(cur);
      cur = [];
    }
    cur.push({ ...word, text: word.text.trim() });
  }
  if (cur.length) groups.push(cur);
  return groups.map((group) => ({
    start: group[0].start,
    end: Math.max(group[group.length - 1].end, group[0].start + 0.18),
    text: group.map((w) => w.text).join(" "),
    source: "heard",
    cutId,
    words: group,
  }));
}
