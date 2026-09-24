import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto("http://127.0.0.1:8080", { waitUntil: "networkidle" });
  const result = await page.evaluate(async () => {
    const response = await fetch("/story-fixture.mp4");
    if (!response.ok) throw new Error("fixture missing");
    const source = await response.blob();
    const file = new File([source], "story-fixture.mp4", { type: "video/mp4" });
    const mod = await import("/src/lib/story-transcript.ts");
    const audio = await mod.extractStoryAudioChunk(file, 0, 30, () => false);
    return { type: audio.type, size: audio.size };
  });

  assert.equal(result.type, "audio/webm");
  assert.ok(result.size > 800, `story audio too small: ${result.size}`);
  assert.ok(result.size < 500_000, `story audio was not compressed enough: ${result.size}`);
} finally {
  await browser.close();
}
