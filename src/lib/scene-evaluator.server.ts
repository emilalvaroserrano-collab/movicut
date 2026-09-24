import { experimental_evaluate as evaluate } from "ai";
import type { JudgeIn, JudgeOut } from "@/lib/identify.server";

type EvaluatedCut = {
  cut: JudgeOut;
  keepProbability: number;
  titleProbability: number;
  rank: number;
};

function probability(value: unknown, fallback = 0.5): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback;
}

export async function evaluateCutsWithJev(
  cuts: JudgeOut[],
  candidates: JudgeIn[],
): Promise<JudgeOut[]> {
  if (!process.env.AI_GATEWAY_API_KEY || !cuts.length) return cuts;

  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));

  const evaluated = await Promise.all(
    cuts.map(async (cut): Promise<EvaluatedCut | null> => {
      const candidate = byId.get(cut.id);
      if (!candidate) return null;

      try {
        const result = await evaluate({
          model: "typesafe-ai/jev",
          state: {
            clip: {
              id: cut.id,
              category: cut.category,
              title: cut.title,
              reason: cut.reason,
              durationSeconds: Math.round((candidate.end - candidate.start) * 10) / 10,
              openingDialogue: candidate.openLine || null,
              sampleDialogue: candidate.lines || null,
              endingDialogue: candidate.closingLine || null,
              quote: candidate.quote || null,
              hookScore: cut.hookScore,
              standaloneScore: cut.standaloneScore,
              payoffScore: cut.payoffScore,
              viralScore: cut.viralScore,
              visualSignals: {
                openingMotion: candidate.motion,
                openingContrast: candidate.contrast,
                openingLight: candidate.lum,
                openingAudio: candidate.audio,
              },
            },
          },
          questions: {
            keep: {
              type: "boolean",
              instructions:
                "Should this 50-59 second clip be kept as a strong standalone short-form selection for a cold viewer? Reject setup-only, context-dependent, weak-hook, duplicate-feeling, or no-payoff clips. Treat the supplied scores as evidence, not ground truth.",
            },
            titleSpecific: {
              type: "boolean",
              instructions:
                "Is the proposed title specific to the supplied scene evidence, curiosity-inducing, non-generic, and non-spoilery?",
            },
          },
          providerOptions: {
            gateway: {
              zeroDataRetention: true,
            },
          },
        });

        const keepProbability = probability(result.answers.keep.probability);
        const titleProbability = probability(result.answers.titleSpecific.probability);
        const rank =
          cut.viralScore * 0.72 +
          keepProbability * 100 * 0.23 +
          titleProbability * 100 * 0.05;

        return { cut, keepProbability, titleProbability, rank };
      } catch {
        return {
          cut,
          keepProbability: 0.5,
          titleProbability: 0.5,
          rank: cut.viralScore,
        };
      }
    }),
  );

  const rows = evaluated.filter((row): row is EvaluatedCut => row !== null);
  if (!rows.length) return cuts;

  return rows
    .filter((row) => row.keepProbability >= 0.45)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 5)
    .map((row) => row.cut);
}
