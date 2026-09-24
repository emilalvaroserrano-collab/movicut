import type { MomentShot } from "@/lib/analyze";
import { extractCutWav, transcribeWav } from "@/lib/hear-cut";
import type { WordSpan } from "@/lib/subtitles";

export type CandidateDialogue = {
  id: string;
  words: WordSpan[];
  transcript: string;
  openingLine: string;
  closingLine: string;
};

function clipText(words: WordSpan[], from: number, to: number, maxChars: number): string {
  return words
    .filter((word) => word.end > from && word.start < to)
    .map((word) => word.text.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

export async function hearCandidatePool(opts: {
  file: File;
  moments: MomentShot[];
  isStale: () => boolean;
  onProgress?: (done: number, total: number) => void;
}): Promise<Map<string, CandidateDialogue>> {
  const targets = opts.moments.filter(
    (moment) => !moment.openLine.trim() && !moment.lines.trim() && !moment.closingLine.trim(),
  );
  const result = new Map<string, CandidateDialogue>();
  if (!targets.length) return result;

  let cursor = 0;
  let done = 0;
  const worker = async () => {
    while (true) {
      if (opts.isStale()) throw new Error("stale");
      const index = cursor++;
      const moment = targets[index];
      if (!moment) return;

      try {
        const wav = await extractCutWav(opts.file, moment.start, moment.end, opts.isStale);
        if (opts.isStale()) throw new Error("stale");
        const relative = await transcribeWav(wav);
        if (opts.isStale()) throw new Error("stale");

        const words: WordSpan[] = relative
          .map((word) => ({
            text: word.text,
            start: moment.start + word.start,
            end: Math.min(moment.end, moment.start + word.end),
          }))
          .filter((word) => word.text.trim() && word.end > word.start + 0.02);

        result.set(moment.id, {
          id: moment.id,
          words,
          transcript: clipText(words, moment.start, moment.end, 620),
          openingLine: clipText(words, moment.start, Math.min(moment.end, moment.start + 7), 180),
          closingLine: clipText(words, Math.max(moment.start, moment.end - 9), moment.end, 220),
        });
      } catch (error) {
        if (opts.isStale() || (error instanceof Error && error.message === "stale")) {
          throw new Error("stale");
        }
        // A single undecodable/silent candidate must not prevent the remaining
        // candidates from reaching Grok 4.7.
      } finally {
        done += 1;
        opts.onProgress?.(done, targets.length);
      }
    }
  };

  // Two workers keep scan latency reasonable without flooding STT/server functions.
  await Promise.all([worker(), worker()]);
  return result;
}
