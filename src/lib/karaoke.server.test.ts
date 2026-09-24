import assert from "node:assert/strict";
import test from "node:test";
import { transcribeWavOnServer } from "./karaoke.server.ts";

function fakeWavBase64(bytes = 2000): string {
  return Buffer.alloc(bytes, 1).toString("base64");
}

test("direct xAI STT preserves provider word timestamps for karaoke", async () => {
  const oldFetch = globalThis.fetch;
  const oldXai = process.env.XAI_API_KEY;
  const oldGateway = process.env.AI_GATEWAY_API_KEY;
  process.env.XAI_API_KEY = "test-direct-key";
  delete process.env.AI_GATEWAY_API_KEY;

  let requestedUrl = "";
  globalThis.fetch = (async (input, init) => {
    requestedUrl = String(input);
    assert.equal(init?.method, "POST");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("authorization"), "Bearer test-direct-key");
    assert.ok(init?.body instanceof FormData);
    return new Response(
      JSON.stringify({
        text: "You cannot leave now",
        duration: 2.4,
        words: [
          { text: "You", start: 0.10, end: 0.42, confidence: 0.99 },
          { text: "cannot", start: 0.43, end: 0.91, confidence: 0.98 },
          { text: "leave", start: 0.92, end: 1.34, confidence: 0.97 },
          { text: "now", start: 1.35, end: 1.80, confidence: 0.96 },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const result = await transcribeWavOnServer(fakeWavBase64());
    assert.equal(requestedUrl, "https://api.x.ai/v1/stt");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.words, [
      { text: "You", start: 0.10, end: 0.42 },
      { text: "cannot", start: 0.43, end: 0.91 },
      { text: "leave", start: 0.92, end: 1.34 },
      { text: "now", start: 1.35, end: 1.80 },
    ]);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldXai === undefined) delete process.env.XAI_API_KEY;
    else process.env.XAI_API_KEY = oldXai;
    if (oldGateway === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = oldGateway;
  }
});

test("direct xAI STT falls back to evenly timed words when only text and duration are returned", async () => {
  const oldFetch = globalThis.fetch;
  const oldXai = process.env.XAI_API_KEY;
  const oldGateway = process.env.AI_GATEWAY_API_KEY;
  process.env.XAI_API_KEY = "test-direct-key";
  delete process.env.AI_GATEWAY_API_KEY;

  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ text: "Never open that door", duration: 4 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;

  try {
    const result = await transcribeWavOnServer(fakeWavBase64());
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.words.length, 4);
    assert.deepEqual(result.words[0], { text: "Never", start: 0, end: 1 });
    assert.deepEqual(result.words[3], { text: "door", start: 3, end: 4 });
  } finally {
    globalThis.fetch = oldFetch;
    if (oldXai === undefined) delete process.env.XAI_API_KEY;
    else process.env.XAI_API_KEY = oldXai;
    if (oldGateway === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = oldGateway;
  }
});

test("transcription rejects undersized audio before calling a provider", async () => {
  const oldXai = process.env.XAI_API_KEY;
  process.env.XAI_API_KEY = "test-direct-key";
  try {
    const result = await transcribeWavOnServer(fakeWavBase64(100));
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /can't be captioned/i);
  } finally {
    if (oldXai === undefined) delete process.env.XAI_API_KEY;
    else process.env.XAI_API_KEY = oldXai;
  }
});
