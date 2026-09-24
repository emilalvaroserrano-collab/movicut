# Movicut

Movicut is a mobile-first AI-assisted short-form video editor. It analyzes a movie locally, proposes up to five 50–59 second clips, ranks their short-form retention potential, creates scene-specific hook titles, selects attention-worthy cover frames, generates karaoke captions, and exports vertical social clips.

## Current pipeline

1. The full movie is opened and decoded in the browser.
2. Movicut samples visual motion, luminance, contrast, available subtitle/dialogue context, and lightweight audio energy where practical.
3. The strongest standalone 50–59 second candidates are shortlisted.
4. Up to ten diverse candidate windows are built across the movie instead of only keeping the highest-motion scenes.
5. When subtitles are missing, candidate dialogue is transcribed before final selection so the judge can understand what is actually being said.
6. Grok 4.7 runs through Vercel AI Gateway with strict JSON-schema output and ranks clips for hook strength, standalone clarity, emotion, payoff, visual strength, and quotability.
7. Jev independently evaluates the proposed selections and helps reject/rerank weak cold-viewer clips.
8. Selected candidate transcripts are reused for karaoke instead of transcribing winners a second time.
9. The browser composes a 9:16 render with title, video, karaoke captions, and music.
10. Export prefers H.264/AAC MP4 through Mediabunny and falls back to WebM when the device cannot encode AVC/AAC.

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

Server-side AI features should use:

```text
AI_GATEWAY_API_KEY
```

This single Vercel AI Gateway credential powers:

- `spacexai/grok-4.7` — final multimodal scene selection with strict structured output.
- `typesafe-ai/jev` — independent typed quality evaluation/reranking.
- `spacexai/grok-stt` — candidate dialogue and karaoke transcription.

`XAI_API_KEY` is supported only as an optional migration fallback for direct xAI scene/STT calls.

Keep both values server-side. Do **not** expose either key through a `VITE_` variable and do not commit real tokens to Git.

## Vercel

The project already uses TanStack Start with Nitro's Vercel preset. `vercel.json` explicitly identifies the framework.

For Git deployment:

1. Import this GitHub repository into Vercel.
2. Add `AI_GATEWAY_API_KEY` under **Settings → Environment Variables** for Production and Preview.
3. Optionally add `XAI_API_KEY` only if you want the direct-provider migration fallback.
4. Deploy the branch or merge to the production branch.

No full source movie upload is required by the Movicut pipeline; only shortlisted candidate frames and selected-cut audio are sent to the AI server functions.
