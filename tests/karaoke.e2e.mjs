import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const fixture = resolve("tests/fixtures/karaoke-fixture.mp4");
const size = statSync(fixture).size;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.addInitScript(
  ({ fixtureSize }) => {
    localStorage.setItem(
      "movicut-project-v3",
      JSON.stringify({
        name: "karaoke-fixture.mp4",
        size: fixtureSize,
        selectionVersion: 3,
        cuts: [
          {
            id: "dialogue-2-0",
            start: 2,
            end: 56,
            category: "dialogue",
            score: 0.9,
            viralScore: 82,
            hookScore: 80,
            standaloneScore: 90,
            payoffScore: 75,
            title: "DON'T OPEN\nTHAT *DOOR*",
            reason: "Runtime karaoke fixture",
          },
        ],
        cues: [
          {
            start: 2.1,
            end: 3.8,
            text: "DON'T OPEN THAT DOOR",
            source: "heard",
            cutId: "dialogue-2-0",
            words: [
              { text: "DON'T", start: 2.1, end: 2.4 },
              { text: "OPEN", start: 2.41, end: 2.8 },
              { text: "THAT", start: 2.81, end: 3.15 },
              { text: "DOOR", start: 3.16, end: 3.8 },
            ],
          },
        ],
        srtName: "Heard from the cut",
      }),
    );
  },
  { fixtureSize: size },
);

try {
  await page.goto("http://127.0.0.1:8080", { waitUntil: "networkidle" });
  const fileInput = page.locator('input[type="file"][accept*="video"]');
  await fileInput.setInputFiles(fixture);

  await page.getByText("Runtime karaoke fixture").waitFor({ state: "visible", timeout: 15000 });
  await page.waitForFunction(() => {
    const video = document.querySelector("video");
    return video instanceof HTMLVideoElement && video.readyState >= 1 && video.duration >= 50;
  });

  await page.evaluate(() => {
    const video = document.querySelector("video");
    if (!(video instanceof HTMLVideoElement)) throw new Error("video missing");
    video.pause();
    video.currentTime = 2.2;
  });

  const words = page.locator(".karaoke-cut");
  await words.first().waitFor({ state: "visible", timeout: 5000 });
  assert.equal(await words.count(), 4);
  assert.equal((await page.locator(".karaoke-cut.is-hot").textContent())?.trim(), "DON'T");

  const firstColor = await page.locator(".karaoke-cut.is-hot").evaluate((el) => getComputedStyle(el).color);
  assert.equal(firstColor, "rgb(255, 225, 74)");

  await page.evaluate(() => {
    const video = document.querySelector("video");
    if (!(video instanceof HTMLVideoElement)) throw new Error("video missing");
    video.currentTime = 2.6;
  });

  await page.waitForFunction(() => document.querySelector(".karaoke-cut.is-hot")?.textContent?.trim() === "OPEN");
  assert.equal((await page.locator(".karaoke-cut.is-hot").textContent())?.trim(), "OPEN");

  const inactiveColor = await page.locator(".karaoke-cut").first().evaluate((el) => getComputedStyle(el).color);
  assert.equal(inactiveColor, "rgb(244, 239, 228)");
} finally {
  await browser.close();
}
