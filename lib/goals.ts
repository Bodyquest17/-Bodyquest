export const SLOGAN = "JEDE MISSION BRINGT DICH DEINEM ZIEL NÄHER!";

export const GOALS = [
  { key: "muskelaufbau", label: "Muskelaufbau", desc: "Mehr Muskelmasse aufbauen" },
  { key: "abnehmen", label: "Abnehmen", desc: "Körperfett reduzieren" },
  { key: "definieren", label: "Definieren", desc: "Muskeln erhalten, Fett abbauen" },
  { key: "gewicht_halten", label: "Gewicht halten", desc: "Dein Gewicht stabil halten" },
  { key: "kraft", label: "Kraft steigern", desc: "Stärker werden" },
  { key: "ausdauer", label: "Ausdauer verbessern", desc: "Länger durchhalten" },
  { key: "allgemein", label: "Allgemeine Fitness", desc: "Fit und gesund bleiben" },
  { key: "leistung", label: "Sportliche Leistung", desc: "Besser im Sport werden" },
] as const;

export const goalLabel = (key?: string | null) =>
  GOALS.find((g) => g.key === key)?.label ?? "Dein Ziel";

export const CATEGORY_LABEL: Record<string, string> = {
  kraft: "Kraft", cardio: "Cardio", ernaehrung: "Ernährung", regeneration: "Regeneration", disziplin: "Disziplin",
};
export const DIFFICULTY_LABEL = ["", "Leicht", "Mittel", "Schwer"];

export function rankForLevel(level: number): string {
  if (level <= 5) return "Rookie";
  if (level <= 10) return "Challenger";
  if (level <= 20) return "Athlete";
  if (level <= 35) return "Warrior";
  if (level <= 50) return "Elite";
  return "Legend";
}
