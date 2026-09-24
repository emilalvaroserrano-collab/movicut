import { createServerFn } from "@tanstack/react-start";
import type { StoryChunkResult } from "@/lib/story-transcript.server";

export const transcribeStoryChunk = createServerFn({ method: "POST" })
  .validator((input: { audioBase64: string; mimeType: string }) => {
    if (
      !input ||
      typeof input.audioBase64 !== "string" ||
      input.audioBase64.length < 500 ||
      input.audioBase64.length > 5_500_000
    ) {
      throw new Error("That story-audio chunk cannot be transcribed.");
    }
    const mimeType = String(input.mimeType || "audio/webm").slice(0, 80);
    return { audioBase64: input.audioBase64, mimeType };
  })
  .handler(async ({ data }): Promise<StoryChunkResult> => {
    const { transcribeStoryChunkOnServer } = await import("@/lib/story-transcript.server");
    return transcribeStoryChunkOnServer(data);
  });
