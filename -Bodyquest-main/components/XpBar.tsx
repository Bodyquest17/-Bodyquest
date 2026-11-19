import { levelProgress } from "@/lib/xp";

export function XpBar({ xp }: { xp: number }) {
  const p = levelProgress(xp);
  return (
    <section className="card" aria-label="Level-Fortschritt">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">Aktuelles Level</p>
          <p className="font-display text-6xl font-extrabold leading-none text-accent">{p.level}</p>
        </div>
        <p className="text-right text-sm text-muted">
          <span className="block font-display text-2xl font-bold text-white">{xp.toLocaleString("de-DE")} XP</span>
          noch {(p.needed - p.inLevel).toLocaleString("de-DE")} XP bis Level {p.level + 1}
        </p>
      </div>
      <div
        className="mt-4 h-3 overflow-hidden rounded-full bg-bg"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={p.percent}
        aria-label={`${p.percent} Prozent bis zum nächsten Level`}
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${p.percent}%` }} />
      </div>
    </section>
  );
}
