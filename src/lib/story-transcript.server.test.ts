import assert from "node:assert/strict";
import test from "node:test";
import {
  extractStoryWords,
  transcribeStoryChunkOnServer,
} from "./story-transcript.server.ts";

test("extractStoryWords reads Gemini word_info annotations with speaker and offsets", () => {
  const words = extractStoryWords({
    steps: [
      {
        type: "model_output",
        content: [
          {
            type: "text",
            text: "I know the truth",
            annotations: [
              { type: "word_info", text: "I", speaker: "spk_1", start_offset: "0.100s", end_offset: "0.240s" },
              { type: "word_info", text: "know", speaker: "spk_1", start_offset: "0.250s", end_offset: "0.520s" },
              { type: "word_info", text: "the", speaker: "spk_1", start_offset: "0.530s", end_offset: "0.650s" },
              { type: "word_info", text: "truth", speaker: "spk_1", start_offset: "0.660s", end_offset: "1.020s" },
            ],
          },
        ],
      },
    ],
  });
  assert.deepEqual(words, [
    { text: "I", speaker: "spk_1", start: 0.1, end: 0.24 },
    { text: "know", speaker: "spk_1", start: 0.25, end: 0.52 },
    { text: "the", speaker: "spk_1", start: 0.53, end: 0.65 },
    { text: "truth", speaker: "spk_1", start: 0.66, end: 1.02 },
  ]);
});

test("story transcription uploads compressed audio then calls gemini-3.5-transcribe with timestamps", async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-gemini-key";

  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/upload/v1beta/files")) {
      return new Response(null, {
        status: 200,
        headers: { "x-goog-upload-url": "https://upload.example/story" },
      });
    }
    if (url === "https://upload.example/story") {
      return new Response(
        JSON.stringify({
          file: {
            name: "files/story-test",
            uri: "https://generativelanguage.googleapis.com/v1beta/files/story-test",
            mimeType: "audio/webm",
            state: "ACTIVE",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.endsWith("/v1beta/interactions")) {
      return new Response(
        JSON.stringify({
          steps: [
            {
              type: "model_output",
              content: [
                {
                  type: "text",
                  text: "I know the truth",
                  annotations: [
                    { type: "word_info", text: "I", speaker: "spk_1", start_offset: "0.1s", end_offset: "0.2s" },
                    { type: "word_info", text: "know", speaker: "spk_1", start_offset: "0.21s", end_offset: "0.5s" },
                    { type: "word_info", text: "the", speaker: "spk_1", start_offset: "0.51s", end_offset: "0.65s" },
                    { type: "word_info", text: "truth", speaker: "spk_1", start_offset: "0.66s", end_offset: "1.0s" },
                  ],
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.endsWith("/v1beta/files/story-test") && init?.method === "DELETE") {
      return new Response(null, { status: 200 });
    }
    throw new Error(`Unexpected fetch ${url}`);
  }) as typeof fetch;

  try {
    const result = await transcribeStoryChunkOnServer({
      audioBase64: Buffer.alloc(1200, 1).toString("base64"),
      mimeType: "audio/webm",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.text, "I know the truth");
    assert.equal(result.words.length, 4);

    const interaction = calls.find((call) => call.url.endsWith("/v1beta/interactions"));
    assert.ok(interaction);
    const body = JSON.parse(String(interaction.init?.body));
    assert.equal(body.model, "gemini-3.5-transcribe");
    assert.deepEqual(
      body.generation_config.transcription_config.mode.timestamp_granularities,
      ["word"],
    );
    assert.equal(body.generation_config.transcription_config.mode.diarization_mode, "speaker");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
  }
});
