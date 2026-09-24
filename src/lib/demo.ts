import { cuesToPhrases, type Phrase } from "@/lib/subtitles";

export const DEMO_TITLE = "THIS IS HOW\nA QUIET SCENE *TURNS*";
export const DEMO_LOOP = 12.4;

const LINES = [
  { start: 0.35, end: 2.55, text: "Wait. Say that again." },
  { start: 3.05, end: 5.2, text: "I kept the ticket." },
  { start: 5.75, end: 8.75, text: "You already know how this ends." },
  { start: 9.2, end: 11.85, text: "Then don't look away." },
];

export const DEMO_PHRASES: Phrase[] = cuesToPhrases(LINES);
