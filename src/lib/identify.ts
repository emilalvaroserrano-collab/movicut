import { createServerFn } from "@tanstack/react-start";
import type { Category, Cut, MomentShot } from "@/lib/analyze";

export type JudgedCut = {
  id: string;
  category: Category;
  title: string;
  reason: string;
  viralScore: number;
  hookScore: number;
  thumbnailChoice: "opening" | "peak";
};

const WEAK_HOOKS = new Set(["THE", "THIS", "A", "AN", "IT", "AND", "OF", "TO", "IN", "ON", "IS", "FOR", "YOU"]);

function hookWord(line: string): string {
  const parts = line.replace(/\*/g, "").split(" ").filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const bare = parts[i].replace(/[^A-Z0-9]/g, "");
    if (bare && !WEAK_HOOKS.has(bare)) return parts.map((part, index) => (index === i ? `*${part}*` : part)).join(" ");
  }
  if (!parts.length) return line;
  parts[parts.length - 1] = `*${parts[parts.length - 1]}*`;
  return parts.join(" ");
}

export function cleanTitle(raw: string): string {
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((line) => line.toUpperCase().replace(/\s+/g, " ").slice(0, 52));
  if (!lines.length) return "THIS SCENE\n*HITS*";
  const marked = lines.map((line) => {
    const hooks = [...line.matchAll(/\*([^*]+)\*/g)].map((match) => match[1].replace(/[^A-Z0-9]/g, ""));
    if (!hooks.length || hooks.every((word) => WEAK_HOOKS.has(word))) return hookWord(line);
    return line;
  });
  return marked.join("\n");
}

export function cutsFromJudgement(fallback: Cut[], shots: MomentShot[], judged: JudgedCut[]): Cut[] {
  const byId = new Map(shots.map((shot) => [shot.id, shot]));
  const next: Cut[] = [];
  const overlaps = (start: number, end: number) => next.some((cut) => start < cut.end + 12 && cut.start < end + 12);

  for (const row of judged) {
    const shot = byId.get(row.id);
    if (!shot || overlaps(shot.start, shot.end)) continue;
    const category = row.category || shot.category;
    next.push({
      id: `${category}-${Math.round(shot.start)}-${next.length}`,
      start: shot.start,
      end: shot.end,
      category,
      score: shot.score,
      viralScore: Math.max(0, Math.min(100, Math.round(row.viralScore ?? shot.score * 100))),
      hookScore: Math.max(0, Math.min(100, Math.round(row.hookScore ?? shot.score * 100))),
      title: cleanTitle(row.title),
      reason: row.reason || "The first few seconds create a clear reason to keep watching.",
      quote: shot.quote ?? undefined,
      thumb: row.thumbnailChoice === "opening" ? shot.openingImage : shot.thumbnailImage,
      thumbnailAt: row.thumbnailChoice === "opening" ? shot.frameAt : shot.thumbnailAt,
    });
    if (next.length >= 5) break;
  }

  if (next.length < 5) {
    for (const cut of [...fallback].sort((a, b) => b.score - a.score)) {
      if (next.length >= 5) break;
      if (overlaps(cut.start, cut.end)) continue;
      next.push({ ...cut, id: `${cut.category}-${Math.round(cut.start)}-${next.length}` });
    }
  }

  return next.length ? next : fallback;
}

type Payload = {
  moments: {
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
  }[];
};

export const judgeMoments = createServerFn({ method: "POST" })
  .validator((input: Payload) => {
    if (!input || !Array.isArray(input.moments) || input.moments.length < 2 || input.moments.length > 6) {
      throw new Error("Not enough scenes to read.");
    }
    return {
      moments: input.moments.map((moment) => ({
        id: String(moment.id).slice(0, 12),
        start: Number(moment.start) || 0,
        end: Number(moment.end) || 0,
        category: String(moment.category).slice(0, 16),
        score: Number(moment.score) || 0,
        quote: String(moment.quote ?? "").slice(0, 140),
        lines: String(moment.lines ?? "").slice(0, 240),
        openLine: String(moment.openLine ?? "").slice(0, 160),
        closingLine: String(moment.closingLine ?? "").slice(0, 180),
        motion: Number(moment.motion) || 0,
        contrast: Number(moment.contrast) || 0,
        lum: Number(moment.lum) || 0,
        audio: Number(moment.audio) || 0,
        openingImage: String(moment.openingImage ?? "").replace(/^data:image\/jpeg;base64,/, "").slice(0, 180_000),
        thumbnailImage: String(moment.thumbnailImage ?? "").replace(/^data:image\/jpeg;base64,/, "").slice(0, 180_000),
        thumbnailAt: Number(moment.thumbnailAt) || 0,
      })),
    };
  })
  .handler(async ({ data }) => {
    const { judgeMomentsOnServer } = await import("@/lib/identify.server");
    return judgeMomentsOnServer(data.moments);
  });
