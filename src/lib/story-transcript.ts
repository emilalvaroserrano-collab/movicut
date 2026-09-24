import type { Cue, WordSpan } from "@/lib/subtitles";
import { transcribeStoryChunk } from "@/lib/story-transcript.api";

export type StoryWord = WordSpan & { speaker?: string };

export type StoryTranscriptChunk = {
  start: number;
  end: number;
  text: string;
  words: StoryWord[];
};

export type StoryTranscript = {
  chunks: StoryTranscriptChunk[];
  words: StoryWord[];
  cues: Cue[];
  context: string;
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      const comma = value.indexOf(",");
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.onerror = () => reject(new Error("Could not pack story audio."));
    reader.readAsDataURL(blob);
  });
}

export async function extractStoryAudioChunk(
  file: File,
  start: number,
  end: number,
  isStale: () => boolean,
): Promise<Blob> {
  const {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Conversion,
    Input,
    Output,
    WebMOutputFormat,
  } = await import("mediabunny");

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const target = new BufferTarget();
  const output = new Output({ format: new WebMOutputFormat(), target });
  let conversion: Awaited<ReturnType<typeof Conversion.init>> | null = null;
  const watch = window.setInterval(() => {
    if (isStale()) void conversion?.cancel();
  }, 250);

  try {
    conversion = await Conversion.init({
      input,
      output,
      showWarnings: false,
      tracks: "primary",
      video: { discard: true },
      audio: {
        codec: "opus",
        bitrate: 24_000,
        sampleRate: 16_000,
        numberOfChannels: 1,
        forceTranscode: true,
      },
      trim: { start, end },
    });
    if (!conversion.isValid) {
      throw new Error("This browser cannot prepare the movie audio for story transcription.");
    }
    await conversion.execute();
    if (isStale()) throw new Error("stale");
    if (!target.buffer || target.buffer.byteLength < 800) {
      throw new Error("The movie did not contain enough readable audio.");
    }
    return new Blob([target.buffer], { type: "audio/webm" });
  } finally {
    window.clearInterval(watch);
    input.dispose();
  }
}

function approximateWords(text: string, start: number, end: number): StoryWord[] {
  const words = text.split(/\s+/).map((word) => word.trim()).filter(Boolean);
  if (!words.length || end <= start) return [];
  const step = (end - start) / words.length;
  return words.map((word, index) => ({
    text: word,
    start: start + index * step,
    end: start + (index + 1) * step,
  }));
}

export function storyWordsToCues(words: StoryWord[]): Cue[] {
  const clean = words
    .filter((word) => word.text.trim() && word.end > word.start)
    .sort((a, b) => a.start - b.start);
  const groups: StoryWord[][] = [];
  let group: StoryWord[] = [];

  const flush = () => {
    if (group.length) groups.push(group);
    group = [];
  };

  for (const word of clean) {
    const prev = group[group.length - 1];
    const speakerChanged = Boolean(prev?.speaker && word.speaker && prev.speaker !== word.speaker);
    const gap = prev ? word.start - prev.end : 0;
    const sentenceEnded = prev ? /[.!?]["']?$/.test(prev.text) : false;
    if (group.length && (group.length >= 10 || gap > 0.9 || speakerChanged || sentenceEnded)) flush();
    group.push(word);
  }
  flush();

  return groups.map((items) => ({
    start: items[0].start,
    end: items[items.length - 1].end,
    text: items.map((word) => word.text).join(" "),
  }));
}

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

export async function transcribeMovieStory(opts: {
  file: File;
  duration: number;
  isStale: () => boolean;
  onProgress?: (ratio: number, label: string) => void;
}): Promise<StoryTranscript> {
  const CHUNK_SECONDS = 6 * 60;
  const ranges: Array<{ start: number; end: number }> = [];
  for (let start = 0; start < opts.duration - 0.05; start += CHUNK_SECONDS) {
    ranges.push({ start, end: Math.min(opts.duration, start + CHUNK_SECONDS) });
  }

  const chunks: StoryTranscriptChunk[] = [];
  let cursor = 0;
  let done = 0;

  const worker = async () => {
    while (true) {
      if (opts.isStale()) throw new Error("stale");
      const index = cursor++;
      const range = ranges[index];
      if (!range) return;

      opts.onProgress?.(
        0.02 + (done / Math.max(1, ranges.length)) * 0.16,
        `Gemini is transcribing the story at ${formatClock(range.start)}`,
      );

      const blob = await extractStoryAudioChunk(opts.file, range.start, range.end, opts.isStale);
      if (opts.isStale()) throw new Error("stale");
      const audioBase64 = await blobToBase64(blob);
      const result = await transcribeStoryChunk({
        data: { audioBase64, mimeType: blob.type || "audio/webm" },
      });
      if (!result.ok) throw new Error(result.error);

      const shifted = result.words.length
        ? result.words.map((word) => ({
            text: word.text,
            start: range.start + word.start,
            end: Math.min(range.end, range.start + word.end),
            speaker: word.speaker,
          }))
        : approximateWords(result.text, range.start, range.end);

      const chunkText =
        result.text.trim() ||
        shifted.map((word) => word.text).join(" ").replace(/\s+/g, " ").trim();

      chunks.push({
        start: range.start,
        end: range.end,
        text: chunkText,
        words: shifted,
      });
      done += 1;
      opts.onProgress?.(
        0.02 + (done / Math.max(1, ranges.length)) * 0.16,
        `Gemini understood story audio ${done}/${ranges.length}`,
      );
    }
  };

  await Promise.all([worker(), worker()]);
  chunks.sort((a, b) => a.start - b.start);
  const words = chunks.flatMap((chunk) => chunk.words).sort((a, b) => a.start - b.start);
  const cues = storyWordsToCues(words);
  const context = cues
    .map((cue) => {
      const speaker = words.find(
        (word) => word.end > cue.start && word.start < cue.end && word.speaker,
      )?.speaker;
      const who = speaker ? ` [${speaker}]` : "";
      return `[${formatClock(cue.start)}-${formatClock(cue.end)}]${who} ${cue.text}`;
    })
    .filter((line) => line.length > 4)
    .join("\n")
    .slice(0, 240_000);

  return { chunks, words, cues, context };
}
