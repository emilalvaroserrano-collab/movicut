import assert from "node:assert/strict";
import test from "node:test";
import { planStoryWindowsOnServer } from "./story-planner.server.ts";

test("Gemini story planner returns non-overlapping 50-59 second narrative windows", async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-gemini-key";

  let requestBody: any = null;
  globalThis.fetch = (async (input, init) => {
    assert.equal(String(input), "https://generativelanguage.googleapis.com/v1beta/interactions");
    requestBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        steps: [
          {
            type: "model_output",
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  summary: "A brother learns who betrayed his family and confronts him.",
                  windows: [
                    {
                      start: 120,
                      end: 174,
                      category: "revenge",
                      reason: "The betrayal is stated and answered in the same scene.",
                      context: "The brother has just confirmed who caused the loss.",
                    },
                    {
                      start: 620,
                      end: 674,
                      category: "dialogue",
                      reason: "A confession changes the relationship and lands before the cut ends.",
                      context: "The truth finally reaches the person who was blamed.",
                    },
                  ],
                }),
              },
            ],
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const result = await planStoryWindowsOnServer({
      transcript: "[2:00-3:00] I know who did it. You betrayed my family.\n[10:20-11:20] I lied to protect you.",
      duration: 1200,
      avoid: [],
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.windows.length, 2);
    assert.equal(result.windows[0].end - result.windows[0].start, 54);
    assert.equal(result.windows[0].category, "revenge");
    assert.equal(requestBody.model, "gemini-3.8-flash");
    assert.equal(requestBody.response_format.mime_type, "application/json");
    assert.match(requestBody.input, /FULL TIMED TRANSCRIPT/);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
  }
});
