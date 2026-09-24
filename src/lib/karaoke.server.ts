export type HeardWord = { text: string; start: number; end: number };

export type TranscribeResult = { ok: true; words: HeardWord[] } | { ok: false; error: string };

const WINDOW_MS = 10 * 60 * 1000;
const MAX_CALLS = 24;

function takeSlot(): boolean {
  const g = globalThis as typeof globalThis & { __karaokeHits?: number[] };
  const now = Date.now();
  const hits = (g.__karaokeHits ??= []);
  while (hits.length && now - (hits[0] ?? 0) > WINDOW_MS) hits.shift();
  if (hits.length >= MAX_CALLS) return false;
  hits.push(now);
  return true;
}

function splitTimedText(text: string, start: number, end: number): HeardWord[] {
  const parts = text.split(/\s+/).map((part) => part.trim()).filter(Boolean);
  if (!parts.length || end <= start) return [];
  const step = (end - start) / parts.length;
  return parts.map((part, index) => ({
    text: part,
    start: +(start + index * step).toFixed(2),
    end: +(start + (index + 1) * step).toFixed(2),
  }));
}

function readWords(body: unknown): HeardWord[] {
  if (!body || typeof body !== "object") return [];
  const rec = body as { text?: unknown; words?: unknown; duration?: unknown };
  const dur = typeof rec.duration === "number" ? rec.duration : 0;
  if (Array.isArray(rec.words)) {
    const out: HeardWord[] = [];
    for (const row of rec.words) {
      if (!row || typeof row !== "object") continue;
      const word = row as { text?: unknown; start?: unknown; end?: unknown; confidence?: unknown };
      if (typeof word.text !== "string" || typeof word.start !== "number" || typeof word.end !== "number") continue;
      if (typeof word.confidence === "number" && word.confidence < 0.02) continue;
      const text = word.text.trim();
      if (!text || word.end <= word.start) continue;
      if (/^[\[(]?(?:music|applause|laughter|silence)[\])]?$/i.test(text)) continue;
      out.push({ text, start: word.start, end: word.end });
      if (out.length >= 400) break;
    }
    if (out.length) return out;
  }
  if (typeof rec.text === "string" && dur > 0.3) {
    return splitTimedText(rec.text, 0, dur).slice(0, 400);
  }
  return [];
}

async function transcribeWithGateway(binary: Buffer): Promise<HeardWord[]> {
  const { transcribe } = await import("ai");
  const result = await transcribe({
    model: "spacexai/grok-stt",
    audio: new Uint8Array(binary),
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(70_000),
  });

  const words: HeardWord[] = [];
  for (const segment of result.segments ?? []) {
    words.push(
      ...splitTimedText(
        segment.text,
        Math.max(0, segment.startSecond),
        Math.max(segment.startSecond + 0.02, segment.endSecond),
      ),
    );
    if (words.length >= 400) break;
  }
  if (words.length) return words.slice(0, 400);

  const duration =
    typeof result.durationInSeconds === "number" && result.durationInSeconds > 0.3
      ? result.durationInSeconds
      : 0;
  return duration > 0 ? splitTimedText(result.text, 0, duration).slice(0, 400) : [];
}

async function transcribeDirectXai(binary: Buffer, apiKey: string): Promise<HeardWord[]> {
  const send = () => {
    const form = new FormData();
    form.append("model", "grok-voice-transcribe-2.0");
    form.append("file", new File([new Uint8Array(binary)], "cut.wav", { type: "audio/wav" }));
    return fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(70_000),
    });
  };

  let res = await send();
  if (res.status === 429 || res.status >= 500) res = await send();
  if (!res.ok) throw new Error(`xAI STT failed (${res.status})`);
  return readWords(await res.json());
}

export async function transcribeWavOnServer(wavBase64: string): Promise<TranscribeResult> {
  const directKey = process.env.XAI_API_KEY;
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  if (!directKey && !gatewayKey) {
    return { ok: false, error: "Karaoke writing needs XAI_API_KEY or AI_GATEWAY_API_KEY." };
  }
  if (!takeSlot()) {
    return { ok: false, error: "Karaoke is paused for a few minutes. Paste the lines if you need them now." };
  }

  const binary = Buffer.from(wavBase64, "base64");
  if (binary.byteLength < 1000 || binary.byteLength > 6_000_000) {
    return { ok: false, error: "That cut's audio can't be captioned." };
  }

  // Keep the direct xAI transcription path first because this is the
  // timestamped karaoke path that was already working before Gateway was
  // introduced for scene-selection/evaluation. Gateway remains a fallback.
  if (directKey) {
    try {
      const words = await transcribeDirectXai(binary, directKey);
      if (words.length) return { ok: true, words };
    } catch {
      // fall through to Gateway when it is also configured
    }
  }

  if (gatewayKey) {
    try {
      const words = await transcribeWithGateway(binary);
      if (words.length) return { ok: true, words };
    } catch {
      // fall through to the user-facing message below
    }
  }

  return { ok: false, error: "Karaoke couldn't be written from that cut just now." };
}
