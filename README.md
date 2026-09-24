# Movicut

Movicut is a mobile-first AI-assisted short-form video editor. It analyzes a movie locally, proposes up to five 50–59 second clips, ranks their short-form retention potential, creates scene-specific hook titles, selects attention-worthy cover frames, generates karaoke captions, and exports vertical social clips.

## Current pipeline

1. The full movie is opened and decoded in the browser.
2. Movicut samples visual motion, luminance, contrast, available subtitle/dialogue context, and lightweight audio energy where practical.
3. The strongest standalone 50–59 second candidates are shortlisted.
4. The server receives only a small set of candidate JPEG frames plus compact scene metadata for AI ranking.
5. AI ranks clips for hook strength, standalone clarity, emotion, payoff, visual strength, and quotability.
6. The selected cut audio is extracted to mono WAV and sent for word-timestamp transcription when subtitles were not supplied.
7. The browser composes a 9:16 render with title, video, karaoke captions, and music.
8. Export prefers H.264/AAC MP4 through Mediabunny and falls back to WebM when the device cannot encode AVC/AAC.

## AI selection rules

The AI should reject slow setup, credits, black frames, repeated beats, context-dependent fragments, and clips whose payoff is outside the selected window. Hook titles must describe the actual scene rather than generic clickbait. The AI sees an opening frame and a separate peak-frame candidate and chooses the stronger cover image.

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

Server-side AI features require:

```text
XAI_API_KEY
```

Keep this value server-side. Do **not** expose it through a `VITE_` variable.

Without the server AI key, browser-side heuristic clip selection still works, but AI scene ranking and automatic transcription are unavailable.

## Vercel

The project already uses TanStack Start with Nitro's Vercel preset. `vercel.json` explicitly identifies the framework.

For Git deployment:

1. Import this GitHub repository into Vercel.
2. Add `XAI_API_KEY` under **Settings → Environment Variables** for Production and Preview as needed.
3. Deploy the branch or merge to the production branch.

No full source movie upload is required by the Movicut pipeline; only shortlisted candidate frames and selected-cut audio are sent to the AI server functions.
