const CATS = ["epic", "comedy", "dialogue", "moral", "action", "revenge"] as const;
type Cat = (typeof CATS)[number];

export type JudgeIn = {
  id: string;
  start: number;
  end: number;
  category: string;
  score: number;
  quote: string;
  lines: string;
  openLine: string;
  closingLine: string;
  motion: number;
  contrast: number;
  lum: number;
  audio: number;
  openingImage: string;
  thumbnailImage: string;
  endingImage: string;
  thumbnailAt: number;
};

export type JudgeOut = {
  id: string;
  category: Cat;
  title: string;
  reason: string;
  viralScore: number;
  hookScore: number;
  standaloneScore: number;
  payoffScore: number;
  thumbnailChoice: "opening" | "peak" | "ending";
};

export type JudgeResult = { ok: true; cuts: JudgeOut[] } | { ok: false; error: string };

const WINDOW_MS = 10 * 60 * 1000;
const MAX_CALLS = 12;
const MAX_CANDIDATES = 10;

function takeSlot(): boolean {
  const g = globalThis as typeof globalThis & { __identifyHits?: number[] };
  const now = Date.now();
  const hits = (g.__identifyHits ??= []);
  while (hits.length && now - (hits[0] ?? 0) > WINDOW_MS) hits.shift();
  if (hits.length >= MAX_CALLS) return false;
  hits.push(now);
  return true;
}

function clampScore(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseCuts(text: string, allowed: Set<string>): JudgeOut[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    return null;
  }
  const rows = (parsed as { cuts?: unknown }).cuts;
  if (!Array.isArray(rows)) return [];

  const out: JudgeOut[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const item = row as {
      id?: unknown;
      category?: unknown;
      title?: unknown;
      reason?: unknown;
      viralScore?: unknown;
      hookScore?: unknown;
      standaloneScore?: unknown;
      payoffScore?: unknown;
      thumbnailChoice?: unknown;
    };
    if (typeof item.id !== "string" || !allowed.has(item.id)) continue;
    if (out.some((cut) => cut.id === item.id)) continue;

    const category = CATS.includes(item.category as Cat) ? (item.category as Cat) : "dialogue";
    const title = typeof item.title === "string" ? item.title.replace(/\r/g, "").trim().slice(0, 90) : "";
    if (!title) continue;
    const reason =
      typeof item.reason === "string"
        ? item.reason.replace(/\s+/g, " ").trim().slice(0, 220)
        : "Strong standalone short-form moment.";
    const thumbnailChoice =
      item.thumbnailChoice === "opening" || item.thumbnailChoice === "ending"
        ? item.thumbnailChoice
        : "peak";

    out.push({
      id: item.id,
      category,
      title,
      reason,
      viralScore: clampScore(item.viralScore, 50),
      hookScore: clampScore(item.hookScore, 50),
      standaloneScore: clampScore(item.standaloneScore, 50),
      payoffScore: clampScore(item.payoffScore, 50),
      thumbnailChoice,
    });
    if (out.length >= 5) break;
  }
  return out;
}

function selectionSchema(ids: string[]) {
  return {
    type: "object",
    properties: {
      cuts: {
        type: "array",
        minItems: 0,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            id: { type: "string", enum: ids },
            category: { type: "string", enum: [...CATS] },
            title: { type: "string", minLength: 3, maxLength: 90 },
            reason: { type: "string", minLength: 8, maxLength: 220 },
            hookScore: { type: "integer", minimum: 0, maximum: 100 },
            viralScore: { type: "integer", minimum: 0, maximum: 100 },
            standaloneScore: { type: "integer", minimum: 0, maximum: 100 },
            payoffScore: { type: "integer", minimum: 0, maximum: 100 },
            thumbnailChoice: {
              type: "string",
              enum: ["opening", "peak", "ending"],
            },
          },
          required: [
            "id",
            "category",
            "title",
            "reason",
            "hookScore",
            "viralScore",
            "standaloneScore",
            "payoffScore",
            "thumbnailChoice",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["cuts"],
    additionalProperties: false,
  };
}

type ResponseContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "high" };

function buildPrompt(clipped: JudgeIn[]): string {
  return [
    "You are MOVICUT's final short-form scene selector. Your decision overrides the browser heuristic.",
    "The heuristic score/category is ONLY a discovery hint. Do not simply pick the highest prefilter score and do not trust its category when the actual scene evidence disagrees.",
    "",
    "TASK",
    "Select 0 to 5 genuinely strong 50–59 second clips for cold viewers on Shorts/Reels/TikTok.",
    "Returning fewer than 5 is correct when the candidates are weak. Never fill quota with mediocre scenes.",
    "Rank selected clips strongest first.",
    "",
    "COLD-VIEWER TEST",
    "A selected clip must make sense without the previous movie scene. The first 1–3 seconds should already contain a reason to stay: conflict, reaction, question, threat, surprise, joke, emotional tension, unusual visual, decision, or immediate action.",
    "The clip must also DELIVER inside its own window. Reject candidates that are only setup, require missing context, end before payoff, start mid-sentence without recoverable context, repeat the same beat, or are mostly transition/establishing footage.",
    "",
    "SCORING",
    "hookScore: first 1–3 second stopping power.",
    "standaloneScore: understandable and satisfying without previous context.",
    "payoffScore: escalation/reveal/joke/action/emotional resolution lands before the cut ends.",
    "viralScore: overall short-form potential. Weight hook 30%, standalone 25%, payoff 20%, emotion/tension 10%, visual clarity 10%, replay/quotability 5%.",
    "Do not inflate scores. 90+ is exceptional. A clip below roughly 60 overall should normally be rejected.",
    "",
    "TITLE",
    "Write a truthful, scene-specific curiosity hook based on what actually happens in THIS clip.",
    "Avoid generic bait such as WATCH TILL THE END, YOU WON'T BELIEVE THIS, THIS CHANGED EVERYTHING, DO NOT BLINK, or THE MOMENT EVERYTHING CHANGED unless the scene itself literally supports that wording.",
    "Use 1–2 lines, ALL CAPS, ideally 5–8 words total and maximum 5 words per line.",
    "Wrap exactly one meaningful word or short phrase in *asterisks*. Do not highlight THE, THIS, A, AN, IT, OF, TO, IS, YOU.",
    "Do not spoil the payoff in the title.",
    "",
    "THUMBNAIL",
    "For every candidate you receive OPENING, PEAK and ENDING frames.",
    "Choose the frame most likely to earn a tap: readable expressive face, confrontation, visible consequence, unusual composition, action frozen clearly, strong body language, or a visually obvious question.",
    "Reject dark, empty, blurry, transitional, backs-of-heads, or visually confusing frames when another option is clearer.",
    "",
    "DUPLICATES",
    "Do not select two candidates that are substantially the same scene/beat even if both score well.",
    "",
    "CANDIDATE METADATA",
    ...clipped.map((m) =>
      [
        `${m.id}: ${Math.round(m.start)}s–${Math.round(m.end)}s`,
        `heuristicGuess=${m.category}`,
        `heuristicPrefilter=${m.score}`,
        `openingVisualSignals motion=${m.motion} contrast=${m.contrast} light=${m.lum} audio=${m.audio}`,
        m.openLine ? `openingDialogue="${m.openLine}"` : "openingDialogue=none",
        m.lines ? `sampleDialogue="${m.lines}"` : "sampleDialogue=none",
        m.closingLine ? `endingDialogue="${m.closingLine}"` : "endingDialogue=none",
        m.quote ? `candidateQuote="${m.quote}"` : "",
        `peakFrameAt=${Math.round(m.thumbnailAt * 10) / 10}s`,
      ]
        .filter(Boolean)
        .join(" | "),
    ),
  ].join("\n");
}

async function readStructuredStream(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let output = "";

  const consumeBlock = (block: string) => {
    for (const rawLine of block.split("\n")) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      let event: { type?: string; delta?: string; error?: { message?: string } };
      try {
        event = JSON.parse(data) as typeof event;
      } catch {
        continue;
      }
      if (
        (event.type === "response.output_text.delta" || event.type === "response.text.delta") &&
        typeof event.delta === "string"
      ) {
        output += event.delta;
      }
      if (event.type === "error") {
        throw new Error(event.error?.message || "Grok 4.7 stream failed.");
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const blocks = pending.split(/\r?\n\r?\n/);
    pending = blocks.pop() ?? "";
    for (const block of blocks) consumeBlock(block);
    if (done) break;
  }
  if (pending.trim()) consumeBlock(pending);
  return output.trim();
}

export async function judgeMomentsOnServer(moments: JudgeIn[]): Promise<JudgeResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "Grok 4.7 scene selection isn't available right now." };
  if (!takeSlot()) return { ok: false, error: "Grok 4.7 scene selection is paused for a few minutes." };

  const clipped = moments
    .slice(0, MAX_CANDIDATES)
    .filter(
      (m) =>
        m.openingImage.length > 80 &&
        m.openingImage.length < 120_000 &&
        m.thumbnailImage.length > 80 &&
        m.thumbnailImage.length < 120_000 &&
        m.endingImage.length > 80 &&
        m.endingImage.length < 120_000,
    );
  if (clipped.length < 2) return { ok: false, error: "Not enough candidate scenes to judge." };

  const content: ResponseContent[] = [{ type: "input_text", text: buildPrompt(clipped) }];
  for (const moment of clipped) {
    content.push({ type: "input_text", text: `${moment.id} — OPENING FRAME` });
    content.push({
      type: "input_image",
      image_url: `data:image/jpeg;base64,${moment.openingImage}`,
      detail: "high",
    });
    content.push({ type: "input_text", text: `${moment.id} — PEAK/COVER FRAME` });
    content.push({
      type: "input_image",
      image_url: `data:image/jpeg;base64,${moment.thumbnailImage}`,
      detail: "high",
    });
    content.push({ type: "input_text", text: `${moment.id} — ENDING FRAME` });
    content.push({
      type: "input_image",
      image_url: `data:image/jpeg;base64,${moment.endingImage}`,
      detail: "high",
    });
  }

  const body = {
    model: "grok-4.7",
    temperature: 0,
    reasoning: { effort: "low" },
    store: false,
    stream: true,
    prompt_cache_key: "movicut-scene-selector-v4",
    text: {
      format: {
        type: "json_schema",
        name: "movicut_scene_selection",
        schema: selectionSchema(clipped.map((m) => m.id)),
        strict: true,
      },
    },
    input: [{ role: "user", content }],
  };

  const ask = () =>
    fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });

  let res: Response;
  try {
    res = await ask();
    if (res.status === 429 || res.status >= 500) res = await ask();
  } catch {
    return { ok: false, error: "Grok 4.7 couldn't judge the scenes just now." };
  }
  if (!res.ok) {
    return { ok: false, error: `Grok 4.7 scene selection failed (${res.status}).` };
  }

  let text: string;
  try {
    text = await readStructuredStream(res);
  } catch {
    return { ok: false, error: "Grok 4.7 returned an incomplete scene selection." };
  }

  if (!text) return { ok: false, error: "Grok 4.7 returned no scene-selection output." };
  const cuts = parseCuts(text, new Set(clipped.map((m) => m.id)));
  if (cuts === null) {
    return { ok: false, error: "Grok 4.7 returned invalid structured scene-selection JSON." };
  }
  return { ok: true, cuts };
}
