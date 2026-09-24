export type StoryWindow = {
  start: number;
  end: number;
  category: "epic" | "comedy" | "dialogue" | "moral" | "action" | "revenge";
  reason: string;
  context: string;
};

export type StoryPlanResult =
  | { ok: true; summary: string; windows: StoryWindow[] }
  | { ok: false; error: string };

const CATEGORIES = ["epic", "comedy", "dialogue", "moral", "action", "revenge"] as const;

function outputText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const steps = (body as { steps?: unknown }).steps;
  if (!Array.isArray(steps)) return "";
  const out: string[] = [];
  for (const step of steps) {
    if (!step || typeof step !== "object") continue;
    const content = (step as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const row = part as { type?: unknown; text?: unknown };
      if (row.type === "text" && typeof row.text === "string") out.push(row.text);
    }
  }
  return out.join("\n").trim();
}

function schema() {
  return {
    type: "object",
    properties: {
      summary: { type: "string", minLength: 10, maxLength: 2000 },
      windows: {
        type: "array",
        minItems: 0,
        maxItems: 12,
        items: {
          type: "object",
          properties: {
            start: { type: "number", minimum: 0 },
            end: { type: "number", minimum: 0 },
            category: { type: "string", enum: [...CATEGORIES] },
            reason: { type: "string", minLength: 8, maxLength: 240 },
            context: { type: "string", minLength: 3, maxLength: 300 },
          },
          required: ["start", "end", "category", "reason", "context"],
          additionalProperties: false,
        },
      },
    },
    required: ["summary", "windows"],
    additionalProperties: false,
  };
}

export async function planStoryWindowsOnServer(opts: {
  transcript: string;
  duration: number;
  avoid: Array<{ start: number; end: number }>;
}): Promise<StoryPlanResult> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) return { ok: false, error: "Story-aware scene planning needs GEMINI_API_KEY." };

  const avoidText = opts.avoid.length
    ? opts.avoid.map((cut) => `${Math.round(cut.start)}-${Math.round(cut.end)}s`).join(", ")
    : "none";

  const prompt = [
    "You are MOVICUT's story editor.",
    "Read the complete timestamped movie transcript below before choosing any clip.",
    "",
    "GOAL",
    "Choose up to 12 scene windows that are the best raw material for 50-59 second Shorts/Reels/TikTok clips.",
    "Use the WHOLE story: character relationships, setup, callbacks, betrayals, reveals, decisions, jokes, threats, emotional turns, victories, losses, and payoffs.",
    "A window must work for a cold viewer but should become more meaningful because you understand what came before and after it.",
    "",
    "WINDOW RULES",
    "- Each window must be 50-59 seconds long.",
    "- Prefer a start where the hook/conflict begins immediately, not 20 seconds before it.",
    "- The payoff/reveal/joke/action/emotional turn must occur before the window ends.",
    "- Avoid credits, exposition with no payoff, long silence, repeated beats, and scenes that only make sense if the viewer saw the prior minute.",
    "- Do not choose substantially overlapping windows.",
    `- Do not reuse these already-shown windows unless there is absolutely no alternative: ${avoidText}`,
    "- Spread choices across the film when quality allows.",
    "- reason: explain why this exact window matters in the whole story.",
    "- context: one sentence describing the relevant story context without spoiling more than necessary.",
    "",
    `MOVIE DURATION: ${Math.round(opts.duration)} seconds`,
    "",
    "FULL TIMED TRANSCRIPT",
    opts.transcript,
  ].join("\n");

  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
        "Api-Revision": "2026-05-20",
      },
      body: JSON.stringify({
        model: "gemini-3.8-flash",
        input: prompt,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: schema(),
        },
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) return { ok: false, error: `Gemini story planning failed (${res.status}).` };
    const text = outputText(await res.json());
    const parsed = JSON.parse(text) as {
      summary?: unknown;
      windows?: unknown;
    };
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim().slice(0, 2000) : "";
    const rows = Array.isArray(parsed.windows) ? parsed.windows : [];
    const windows: StoryWindow[] = [];
    for (const item of rows) {
      if (!item || typeof item !== "object") continue;
      const row = item as {
        start?: unknown;
        end?: unknown;
        category?: unknown;
        reason?: unknown;
        context?: unknown;
      };
      if (typeof row.start !== "number" || typeof row.end !== "number") continue;
      const start = Math.max(0, Math.min(opts.duration - 50, row.start));
      let end = Math.min(opts.duration, row.end);
      const length = end - start;
      if (length < 50 || length > 59) end = Math.min(opts.duration, start + 54);
      if (end - start < 49.5) continue;
      const category = CATEGORIES.includes(row.category as StoryWindow["category"])
        ? (row.category as StoryWindow["category"])
        : "dialogue";
      const overlapsAvoid = opts.avoid.some(
        (cut) => start < cut.end + 8 && cut.start < end + 8,
      );
      if (overlapsAvoid) continue;
      if (windows.some((cut) => start < cut.end + 8 && cut.start < end + 8)) continue;
      windows.push({
        start: Math.round(start * 100) / 100,
        end: Math.round(end * 100) / 100,
        category,
        reason: typeof row.reason === "string" ? row.reason.trim().slice(0, 240) : "",
        context: typeof row.context === "string" ? row.context.trim().slice(0, 300) : "",
      });
      if (windows.length >= 12) break;
    }
    return { ok: true, summary, windows };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gemini story planning failed.",
    };
  }
}
