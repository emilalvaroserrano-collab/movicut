import { createServerFn } from "@tanstack/react-start";

export type HeardWord = { text: string; start: number; end: number };

export type TranscribeResult = { ok: true; words: HeardWord[] } | { ok: false; error: string };

export const transcribeClip = createServerFn({ method: "POST" })
  .validator((input: { wavBase64: string }) => {
    if (!input || typeof input.wavBase64 !== "string" || input.wavBase64.length < 200 || input.wavBase64.length > 8_000_000) {
      throw new Error("That cut's audio can't be captioned.");
    }
    return { wavBase64: input.wavBase64 };
  })
  .handler(async ({ data }): Promise<TranscribeResult> => {
    const { transcribeWavOnServer } = await import("@/lib/karaoke.server");
    return transcribeWavOnServer(data.wavBase64);
  });
