import assert from "node:assert/strict";
import test from "node:test";
import {
  cuesToPhrases,
  phraseAt,
  wordIndexAt,
  wordsToCues,
  type WordSpan,
} from "./subtitles.ts";

test("heard words become karaoke cues in groups of four while preserving exact timings", () => {
  const words: WordSpan[] = [
    { text: "You", start: 100.10, end: 100.40 },
    { text: "cannot", start: 100.41, end: 100.82 },
    { text: "leave", start: 100.83, end: 101.15 },
    { text: "this", start: 101.16, end: 101.40 },
    { text: "room", start: 101.41, end: 101.80 },
    { text: "alive", start: 101.81, end: 102.20 },
  ];

  const cues = wordsToCues(words, "cut-1");
  assert.equal(cues.length, 2);
  assert.equal(cues[0].text, "You cannot leave this");
  assert.equal(cues[0].start, 100.10);
  assert.equal(cues[0].end, 101.40);
  assert.deepEqual(cues[0].words, words.slice(0, 4));
  assert.equal(cues[1].text, "room alive");
});

test("karaoke phrase lookup and active-word index follow word timestamps", () => {
  const words: WordSpan[] = [
    { text: "DON'T", start: 25.00, end: 25.30 },
    { text: "OPEN", start: 25.31, end: 25.70 },
    { text: "THAT", start: 25.71, end: 26.00 },
    { text: "DOOR", start: 26.01, end: 26.55 },
  ];
  const cues = wordsToCues(words, "cut-door");
  const phrases = cuesToPhrases(cues);

  assert.equal(phrases.length, 1);
  assert.equal(phraseAt(phrases, 24.99), null);
  const phrase = phraseAt(phrases, 25.75);
  assert.ok(phrase);
  assert.equal(wordIndexAt(phrase, 25.10), 0);
  assert.equal(wordIndexAt(phrase, 25.50), 1);
  assert.equal(wordIndexAt(phrase, 25.90), 2);
  assert.equal(wordIndexAt(phrase, 26.20), 3);
  assert.equal(phraseAt(phrases, 26.56), null);
});

test("karaoke removes noise-only transcription tokens", () => {
  const cues = wordsToCues(
    [
      { text: "[music]", start: 1, end: 2 },
      { text: "I", start: 2.1, end: 2.3 },
      { text: "know", start: 2.31, end: 2.7 },
      { text: "(laughter)", start: 2.8, end: 3.2 },
    ],
    "cut-noise",
  );
  assert.equal(cues.length, 1);
  assert.equal(cues[0].text, "I know");
});
