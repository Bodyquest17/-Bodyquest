/**
 * Levelformel: XP für Level n = 50 * (n - 1) * (n + 2)
 * L1=0, L2=200, L3=500, L4=900, L5=1.400, L6=2.000, L7=2.700 ...
 * Der Bedarf pro Level steigt jeweils um 100 XP.
 * Die verbindliche Berechnung bei XP-Vergabe passiert später serverseitig in der Datenbank;
 * diese Funktionen dienen der Anzeige.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 * (level - 1) * (level + 2);
}

export function levelFromXp(xp: number): number {
  const safe = Math.max(0, Math.floor(xp));
  let level = 1;
  while (xpForLevel(level + 1) <= safe) level++;
  return level;
}

export function levelProgress(xp: number) {
  const safe = Math.max(0, Math.floor(xp));
  const level = levelFromXp(safe);
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const inLevel = safe - start;
  const needed = next - start;
  return { level, inLevel, needed, percent: Math.round((inLevel / needed) * 100), nextLevelXp: next };
}
