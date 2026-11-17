export function DayRing({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : done / total;
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24" role="img" aria-label={`${done} von ${total} Quests heute erledigt`}>
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#10151C" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#B7F34B" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-2xl font-bold">{done}/{total}</span>
    </div>
  );
}
