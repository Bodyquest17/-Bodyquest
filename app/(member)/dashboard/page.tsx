import { Flame, Swords, Trophy } from "lucide-react";
import { XpBar } from "@/components/XpBar";
import { DayRing } from "@/components/DayRing";
import { EmptyState } from "@/components/EmptyState";
import { PhaseNotice } from "@/components/PhaseNotice";

export const metadata = { title: "Start" };

const WEEK = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function DashboardPage() {
  // Phase 4: Werte kommen aus der Datenbank. Bis dahin zeigt die Oberfläche ehrliche Nullwerte.
  const xp = 0, streak = 0, done = 0, total = 0;
  return (
    <div className="grid gap-4">
      <header>
        <p className="text-muted">Willkommen zurück</p>
        <h1 className="font-display text-4xl font-bold leading-none">Bereit für deine Quests?</h1>
      </header>
      <PhaseNotice phase="Vorschau">Noch ohne Konto. Echte Daten erscheinen ab Phase 4.</PhaseNotice>

      <XpBar xp={xp} />

      <div className="grid grid-cols-2 gap-4">
        <section className="card flex items-center gap-3" aria-label="Streak">
          <Flame className="h-9 w-9 text-accent" aria-hidden />
          <div>
            <p className="font-display text-3xl font-bold leading-none">{streak}</p>
            <p className="text-sm text-muted">Tage in Folge</p>
          </div>
        </section>
        <section className="card flex items-center justify-center" aria-label="Tagesfortschritt">
          <DayRing done={done} total={total} />
        </section>
      </div>

      <section aria-labelledby="heute">
        <h2 id="heute" className="mb-3 font-display text-2xl font-semibold">Heutige Quests</h2>
        <EmptyState icon={Swords} title="Noch keine Quests für heute" text="Sobald Quests veröffentlicht sind, findest du sie hier." />
      </section>

      <section aria-labelledby="challenge">
        <h2 id="challenge" className="mb-3 font-display text-2xl font-semibold">Aktive Challenge</h2>
        <EmptyState icon={Trophy} title="Keine aktive Challenge" text="Tritt einer 7-, 14- oder 30-Tage-Challenge bei, sobald eine verfügbar ist." />
      </section>

      <section aria-labelledby="woche" className="card">
        <h2 id="woche" className="mb-3 font-display text-2xl font-semibold">Deine Woche</h2>
        <ol className="grid grid-cols-7 gap-2 text-center text-xs text-muted">
          {WEEK.map((d) => (
            <li key={d} className="grid gap-1">
              <span aria-hidden className="mx-auto h-9 w-9 rounded-full border border-white/10 bg-bg" />
              <span>{d}</span>
              <span className="sr-only">: keine Quests erledigt</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
