export type StoryWord = {
  text: string;
  start: number;
  end: number;
  speaker?: string;
};

export type StoryChunkResult =
  | { ok: true; text: string; words: StoryWord[] }
  | { ok: false; error: string };

function seconds(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const m = value.trim().match(/^([0-9]+(?:\.[0-9]+)?)s$/);
  return m ? Number(m[1]) : 0;
}

function outputText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const steps = (body as { steps?: unknown }).steps;
  if (!Array.isArray(steps)) return "";
  const texts: string[] = [];
  for (const step of steps) {
    if (!step || typeof step !== "object") continue;
    const content = (step as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const p = part as { type?: unknown; text?: unknown };
      if (p.type === "text" && typeof p.text === "string") texts.push(p.text);
    }
  }
  return texts.join("\n").trim();
}

export function extractStoryWords(body: unknown): StoryWord[] {
  if (!body || typeof body !== "object") return [];
  const steps = (body as { steps?: unknown }).steps;
  if (!Array.isArray(steps)) return [];
  const words: StoryWord[] = [];
  for (const step of steps) {
    if (!step || typeof step !== "object") continue;
    const content = (step as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const annotations = (part as { annotations?: unknown }).annotations;
      if (!Array.isArray(annotations)) continue;
      for (const annotation of annotations) {
        if (!annotation || typeof annotation !== "object") continue;
        const a = annotation as {
          type?: unknown;
          text?: unknown;
          speaker?: unknown;
          start_offset?: unknown;
          end_offset?: unknown;
        };
        if (a.type !== "word_info" || typeof a.text !== "string") continue;
        const start = seconds(a.start_offset);
        const end = seconds(a.end_offset);
        const text = a.text.trim();
        if (!text || end <= start) continue;
        words.push({
          text,
          start,
          end,
          speaker: typeof a.speaker === "string" ? a.speaker : undefined,
        });
      }
    }
  }
  return words.slice(0, 12_000);
}

async function uploadGeminiAudio(apiKey: string, binary: Buffer, mimeType: string) {
  const start = await fetch("https://generativelanguage.googleapis.com/upload/v1beta/files", {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(binary.byteLength),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: "movicut-story-audio" } }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!start.ok) throw new Error(`Gemini file upload start failed (${start.status})`);
  const uploadUrl = start.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new Error("Gemini file upload URL was missing.");

  const uploaded = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(binary.byteLength),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "Content-Type": mimeType,
    },
    body: new Uint8Array(binary),
    signal: AbortSignal.timeout(60_000),
  });
  if (!uploaded.ok) throw new Error(`Gemini file upload failed (${uploaded.status})`);
  const data = (await uploaded.json()) as {
    file?: { name?: string; uri?: string; mimeType?: string; mime_type?: string; state?: string };
  };
  const file = data.file;
  if (!file?.name || !file.uri) throw new Error("Gemini did not return an uploaded file.");

  let state = file.state ?? "ACTIVE";
  for (let attempt = 0; state === "PROCESSING" && attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    const status = await fetch(`https://generativelanguage.googleapis.com/v1beta/${file.name}`, {
      headers: { "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(15_000),
    });
    if (!status.ok) break;
    const meta = (await status.json()) as { state?: string };
    state = meta.state ?? state;
  }
  if (state === "FAILED") throw new Error("Gemini could not process this audio chunk.");

  return {
    name: file.name,
    uri: file.uri,
    mimeType: file.mimeType ?? file.mime_type ?? mimeType,
  };
}

async function deleteGeminiFile(apiKey: string, name: string) {
  await fetch(`https://generativelanguage.googleapis.com/v1beta/${name}`, {
    method: "DELETE",
    headers: { "x-goog-api-key": apiKey },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => undefined);
}

export async function transcribeStoryChunkOnServer(opts: {
  audioBase64: string;
  mimeType: string;
}): Promise<StoryChunkResult> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Full-story transcription needs GEMINI_API_KEY." };
  }

  const binary = Buffer.from(opts.audioBase64, "base64");
  if (binary.byteLength < 800 || binary.byteLength > 4_000_000) {
    return { ok: false, error: "That story-audio chunk is outside the supported size." };
  }

  let file: { name: string; uri: string; mimeType: string } | null = null;
  try {
    file = await uploadGeminiAudio(apiKey, binary, opts.mimeType);
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
        "Api-Revision": "2026-05-20",
      },
      body: JSON.stringify({
        model: "gemini-3.5-transcribe",
        input: [{ type: "audio", uri: file.uri, mime_type: file.mimeType }],
        generation_config: {
          transcription_config: {
            language_codes: [],
            mode: {
              type: "verbatim",
              diarization_mode: "speaker",
              timestamp_granularities: ["word"],
            },
          },
        },
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      return { ok: false, error: `Gemini story transcription failed (${res.status}).` };
    }
    const body = await res.json();
    const words = extractStoryWords(body);
    const text = outputText(body);
    // A silent/music-only chunk is valid. The rest of the movie may still
    // contain the dialogue needed for story understanding.
    return { ok: true, text, words };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gemini story transcription failed.",
    };
  } finally {
    if (file) await deleteGeminiFile(apiKey, file.name);
  }
}
