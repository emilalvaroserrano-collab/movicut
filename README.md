# Movicut

Movicut is a mobile-first AI-assisted short-form video editor. It analyzes a movie locally, proposes up to five 50–59 second clips, ranks their short-form retention potential, creates scene-specific hook titles, selects attention-worthy cover frames, generates karaoke captions, and exports vertical social clips.

## Current pipeline

1. The full movie stays on the user's device.
2. In the browser, Movicut extracts low-bitrate mono audio in roughly six-minute chunks.
3. Each compressed audio chunk is temporarily uploaded to the Gemini Files API and transcribed by `gemini-3.5-transcribe` with speaker diarization and word-level timestamps.
4. The complete timed transcript is cached in memory for the currently opened movie.
5. `gemini-3.8-flash` reads the full transcript and proposes story-aware 50–59 second windows based on character relationships, setup/payoff, reveals, conflict, jokes, emotional turns, decisions, and consequences.
6. The browser samples the visual track and captures opening, peak, and ending frames from those Gemini-selected windows.
7. Grok 4.7 performs the final multimodal ranking using the Gemini story summary plus the local dialogue and frames for each candidate.
8. Jev independently evaluates the proposed selections.
9. Karaoke remains a separate tested path: selected-cut audio is transcribed for word timing and rendered with active-word highlighting.
10. Export prefers H.264/AAC MP4 through Mediabunny and falls back to WebM when AVC/AAC encoding is unavailable.

## AI selection rules

The final selector should reject slow setup, credits, black frames, repeated beats, context-dependent fragments, and clips whose payoff is outside the selected window. Hook titles must describe the actual scene rather than generic clickbait. Grok 4.7 receives opening, peak, and ending frames plus opening/sample/ending dialogue for each diverse candidate, then Jev performs a separate typed quality check.

Scores shown in the UI are **potential estimates**, not guaranteed performance.

## Development

Requirements:

- Node.js 22
- npm

Commands:

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

The development server uses the workspace's existing `npm run dev` contract.

## Environment

Required for story-aware selection:

```text
GEMINI_API_KEY
```

Gemini is used for the full-movie story layer:

- `gemini-3.5-transcribe` — compressed full-timeline audio transcription with speaker labels and word timestamps.
- `gemini-3.8-flash` — structured story understanding and 50–59 second narrative window planning.

Final visual selection uses:

```text
AI_GATEWAY_API_KEY
```

- `spacexai/grok-4.7` — final multimodal candidate ranking and scene-specific titles.
- `typesafe-ai/jev` — independent typed evaluation/reranking.

`XAI_API_KEY` is optional but recommended for the direct timestamped karaoke STT path and direct Grok fallback.

All keys are server-only. Do **not** expose them through `VITE_` variables or commit real values.

## Vercel

The project already uses TanStack Start with Nitro's Vercel preset. `vercel.json` explicitly identifies the framework.

For Git deployment:

1. Import this GitHub repository into Vercel.
2. Add `GEMINI_API_KEY` for Production and Preview.
3. Add `AI_GATEWAY_API_KEY` for Production and Preview.
4. Optionally add `XAI_API_KEY` for direct timestamped karaoke STT and direct Grok fallback.
5. Deploy the branch or merge to the production branch.

The original full movie file is never uploaded. Movicut locally creates compressed audio chunks for Gemini story transcription; Gemini Files API uploads are temporary and are explicitly deleted after each chunk is transcribed. Candidate frames are then sent only for final visual ranking.
