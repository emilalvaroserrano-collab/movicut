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
  thumbnailAt: number;
};

export type JudgeOut = {
  id: string;
  category: Cat;
  title: string;
  reason: string;
  viralScore: number;
  hookScore: number;
  thumbnailChoice: "opening" | "peak";
};

export type JudgeResult = { ok: true; cuts: JudgeOut[] } | { ok: false; error: string };

const WINDOW_MS = 10 * 60 * 1000;
const MAX_CALLS = 12;

function takeSlot(): boolean {
  const g = globalThis as typeof globalThis & { __identifyHits?: number[] };
  const now = Date.now();
  const hits = (g.__identifyHits ??= []);
  while (hits.length && now - (hits[0] ?? 0) > WINDOW_MS) hits.shift();
  if (hits.length >= MAX_CALLS) return false;
  hits.push(now);
  return true;
}

function parseCuts(text: string, allowed: Set<string>): JudgeOut[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return [];
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
      thumbnailChoice?: unknown;
    };
    if (typeof item.id !== "string" || !allowed.has(item.id)) continue;
    if (out.some((c) => c.id === item.id)) continue;
    const category = CATS.includes(item.category as Cat) ? (item.category as Cat) : "dialogue";
    const title = typeof item.title === "string" ? item.title.replace(/\r/g, "").trim() : "";
    if (!title) continue;
    const reason = typeof item.reason === "string" ? item.reason.replace(/\s+/g, " ").trim().slice(0, 180) : "";
    const viralScore =
      typeof item.viralScore === "number" && Number.isFinite(item.viralScore)
        ? Math.max(0, Math.min(100, Math.round(item.viralScore)))
        : 50;
    const hookScore =
      typeof item.hookScore === "number" && Number.isFinite(item.hookScore)
        ? Math.max(0, Math.min(100, Math.round(item.hookScore)))
        : viralScore;
    const thumbnailChoice = item.thumbnailChoice === "opening" ? "opening" : "peak";
    out.push({ id: item.id, category, title, reason, viralScore, hookScore, thumbnailChoice });
    if (out.length >= 5) break;
  }
  return out;
}

export async function judgeMomentsOnServer(moments: JudgeIn[]): Promise<JudgeResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "Scene reading isn't available right now." };
  if (!takeSlot()) return { ok: false, error: "Scene reading is paused for a few minutes." };
  const clipped = moments
    .slice(0, 6)
    .filter(
      (m) =>
        m.openingImage.length > 80 &&
        m.openingImage.length < 180_000 &&
        m.thumbnailImage.length > 80 &&
        m.thumbnailImage.length < 180_000,
    );
  if (clipped.length < 2) return { ok: false, error: "Not enough frames to read." };

  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: "text",
      text: [
        "You are the senior short-form editor for MOVICUT. You are selecting clips from a movie the viewer already owns.",
        "Each candidate is 50–59 seconds. For every candidate you receive TWO frames: OPENING (first 3–5 seconds) and PEAK (the strongest potential cover frame from the clip).",
        "Your main job is retention. Select only clips that make sense without needing the previous scene and that create an immediate question, emotion, conflict, surprise, laugh, threat, reveal, or payoff.",
        "Reject slow walk-ins, credits, establishing shots, logos, black frames, silent setup, context-dependent fragments, weak reactions, repeated beats, and clips where the payoff is outside the 50–59 second window.",
        "Score hookScore 0–100 for the first 3–5 seconds. Score viralScore 0–100 for overall short-form potential using: hook 35%, standalone clarity 20%, emotional intensity 15%, payoff 15%, visual strength 10%, replay/quotability 5%.",
        "Do NOT inflate scores. 90+ should be rare. Prefer five genuinely strong clips over filling categories.",
        "Labels describe the actual clip only: epic=major turn; comedy=quotable/laugh; dialogue=strong spoken exchange; moral=clear lesson; action=movement/tension; revenge=payback.",
        "Titles must be specific to what is actually happening in the clip. Never use generic bait like THIS CHANGED EVERYTHING, WATCH TILL THE END, YOU WON'T BELIEVE THIS, or DO NOT BLINK unless those exact words are naturally justified by the scene.",
        "A title should create a truthful curiosity gap using the conflict, quote, decision, reveal, relationship, or consequence already visible in the clip.",
        "Title format: 1–2 lines, ALL CAPS, maximum 5 words per line, ideally 5–8 words total. Wrap exactly one meaningful hook word or short phrase in *asterisks*. Never highlight THE, THIS, A, AN, IT, OF, TO, or IS.",
        "Use the opening dialogue when it is strong; otherwise summarize the concrete tension without spoiling the ending.",
        "thumbnailChoice must be opening or peak. Choose the frame most likely to earn a tap: expressive face/reaction, clear confrontation, unusual composition, visible consequence, action peak, or visually legible subject. Avoid dark/blurred/empty frames.",
        "reason: one concise sentence explaining why the clip can retain a cold viewer.",
        "Rank strongest first. Return at most 5.",
        'Return only JSON: {"cuts":[{"id":"m0","category":"action","title":"HE CAME BACK FOR\\nONE *THING*","reason":"The threat is already visible and the consequence lands inside the clip.","hookScore":88,"viralScore":84,"thumbnailChoice":"peak"}]}',
        "",
        ...clipped.map((m) => {
          return [
            `${m.id} ${Math.round(m.start)}s–${Math.round(m.end)}s`,
            `signalGuess=${m.category} prefilter=${m.score}`,
            `first 5s motion=${m.motion} contrast=${m.contrast} light=${m.lum} sound=${m.audio}`,
            m.openLine ? `opening line: ${m.openLine}` : "opening line: none",
            m.lines && m.lines !== m.openLine ? `later dialogue: ${m.lines}` : "",
            m.closingLine ? `last 8s dialogue: ${m.closingLine}` : "last 8s dialogue: none",
            `peak frame timestamp=${Math.round(m.thumbnailAt * 10) / 10}s`,
          ].filter(Boolean).join(" | ");
        }),
      ].join("\n"),
    },
  ];
  for (const moment of clipped) {
    content.push({ type: "text", text: `${moment.id} OPENING` });
    content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${moment.openingImage}` } });
    content.push({ type: "text", text: `${moment.id} PEAK` });
    content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${moment.thumbnailImage}` } });
  }

  const ask = () =>
    fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.4,
        max_tokens: 700,
        messages: [{ role: "user", content }],
      }),
      signal: AbortSignal.timeout(45_000),
    });

  let res: Response;
  try {
    res = await ask();
    if (res.status === 429 || res.status >= 500) res = await ask();
  } catch {
    return { ok: false, error: "The scenes couldn't be read just now." };
  }
  if (!res.ok) return { ok: false, error: "The scenes couldn't be read." };
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: "The scenes couldn't be read." };
  }
  const text =
    (body as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? "";
  const cuts = parseCuts(text, new Set(clipped.map((m) => m.id)));
  if (!cuts.length) return { ok: false, error: "No scenes came back." };
  return { ok: true, cuts };
}
