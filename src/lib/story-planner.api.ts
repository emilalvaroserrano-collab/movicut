import { createServerFn } from "@tanstack/react-start";
import type { StoryPlanResult } from "@/lib/story-planner.server";

export const planStoryWindows = createServerFn({ method: "POST" })
  .validator((input: {
    transcript: string;
    duration: number;
    avoid?: Array<{ start: number; end: number }>;
  }) => {
    if (!input || typeof input.transcript !== "string" || input.transcript.trim().length < 20) {
      throw new Error("The movie story transcript is empty.");
    }
    const duration = Number(input.duration) || 0;
    if (duration < 50) throw new Error("The movie is too short for story planning.");
    return {
      transcript: input.transcript.slice(0, 120_000),
      duration,
      avoid: Array.isArray(input.avoid)
        ? input.avoid.slice(0, 100).map((cut) => ({
            start: Math.max(0, Number(cut.start) || 0),
            end: Math.max(0, Number(cut.end) || 0),
          }))
        : [],
    };
  })
  .handler(async ({ data }): Promise<StoryPlanResult> => {
    const { planStoryWindowsOnServer } = await import("@/lib/story-planner.server");
    return planStoryWindowsOnServer(data);
  });
