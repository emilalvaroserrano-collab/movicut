export const BED_VOLUME = 0.15;

export function bedSrc(category: string | null | undefined): string {
  if (category === "dialogue" || category === "moral" || category === "comedy") return "/score-dawn.mp3";
  return "/score-suspense.mp3";
}
