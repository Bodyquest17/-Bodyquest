import { Flame, Swords, Trophy } from "lucide-react";
"use client";

import { useCallback, useEffect, useState } from "react";
import { Flame, PartyPopper, Target } from "lucide-react";
import { XpBar } from "@/components/XpBar";
import { DayRing } from "@/components/DayRing";
import { EmptyState } from "@/components/EmptyState";
import { PhaseNotice } from "@/components/PhaseNotice";
import { MissionCard, type Mission } from "@/components/MissionCard";
import { getSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { SLOGAN, goalLabel, rankForLevel } from "@/lib/goals";

export const metadata = { title: "Start" };
type Progress = { percent: number; label: string; goal: string; goal_reached: boolean };
type Reward = { xp: number; bonus: boolean; levelUp: boolean; level: number };

const WEEK = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const NEXT_GOALS = [
  { key: "gewicht_halten", label: "Gewicht halten" },
  { key: "muskelaufbau", label: "Muskeln aufbauen" },
  { key: "kraft", label: "Kraft verbessern" },
  { key: "leistung", label: "Neue Challenge" },
];

export default function DashboardPage() {
  // Phase 4: Werte kommen aus der Datenbank. Bis dahin zeigt die Oberfläche ehrliche Nullwerte.
  const xp = 0, streak = 0, done = 0, total = 0;
  const { loading, profile, error, reload } = useProfile({ requireOnboarding: true });
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [msg, setMsg] = useState("");

  const loadData = useCallback(async () => {
    const sb = getSupabase();
    const m = await sb.rpc("get_today_missions");
    if (m.error) { setMsg(m.error.message); return; }
    setMissions((m.data ?? []) as Mission[]);
    const g = await sb.rpc("goal_progress");
    if (!g.error) setProgress(g.data as Progress);
  }, []);

  useEffect(() => { if (profile?.onboarding_done) void loadData(); }, [profile?.onboarding_done, loadData]);

  async function complete(id: string) {
    setBusy(id); setMsg("");
    const { data, error: e } = await getSupabase().rpc("complete_mission", { p_mission_id: id });
    setBusy(null);
    if (e) { setMsg(e.message); return; }
    if (!data?.already_done) {
      setReward({ xp: data.xp_gained, bonus: data.day_bonus, levelUp: data.leveled_up, level: data.level });
    }
    await Promise.all([loadData(), reload()]);
  }

  async function nextGoal(goal: string) {
    setMsg("");
    const { error: e } = await getSupabase().rpc("change_goal", { p_goal: goal });
    if (e) { setMsg(e.message); return; }
    await Promise.all([loadData(), reload()]);
  }

  if (loading) return <p className="text-muted">Wird geladen...</p>;
  if (error) return <p role="alert" className="text-red-400">{error}</p>;
  if (!profile) return null;

  const done = missions.filter((m) => m.status === "done").length;

return (
<div className="grid gap-4">
<header>
        <p className="text-muted">Willkommen zurück</p>
        <h1 className="font-display text-4xl font-bold leading-none">Bereit für deine Quests?</h1>
        <p className="text-muted">Hallo {profile.username ?? "Athlet"} · {rankForLevel(profile.level)}</p>
        <h1 className="font-display text-4xl font-bold leading-none">{SLOGAN}</h1>
</header>
      <PhaseNotice phase="Vorschau">Noch ohne Konto. Echte Daten erscheinen ab Phase 4.</PhaseNotice>

      <XpBar xp={xp} />
      {progress?.goal_reached && (
        <section className="card grid gap-3 border border-accent/40" aria-label="Ziel erreicht">
          <p className="flex items-center gap-2 font-display text-2xl font-semibold">
            <PartyPopper className="h-6 w-6 text-accent" aria-hidden /> Glückwunsch! Du hast dein Ziel erreicht.
          </p>
          <p className="text-muted">Was ist deine nächste Mission?</p>
          <div className="grid grid-cols-2 gap-2">
            {NEXT_GOALS.map((g) => (
              <button key={g.key} className="btn-ghost" onClick={() => nextGoal(g.key)}>{g.label}</button>
            ))}
          </div>
        </section>
      )}

      {reward && (
        <p role="status" className="card animate-xpPop border border-accent/40 text-center">
          <span className="font-display text-3xl font-bold text-accent">+{reward.xp} XP</span>
          {reward.bonus && <span className="block text-sm text-muted">Inklusive Tagesabschluss-Bonus!</span>}
          {reward.levelUp && <span className="block font-semibold">Level-up! Du bist jetzt Level {reward.level}.</span>}
        </p>
      )}

      <XpBar xp={profile.total_xp} />

<div className="grid grid-cols-2 gap-4">
<section className="card flex items-center gap-3" aria-label="Streak">
<Flame className="h-9 w-9 text-accent" aria-hidden />
<div>
            <p className="font-display text-3xl font-bold leading-none">{streak}</p>
            <p className="font-display text-3xl font-bold leading-none">{profile.streak}</p>
<p className="text-sm text-muted">Tage in Folge</p>
</div>
</section>
<section className="card flex items-center justify-center" aria-label="Tagesfortschritt">
          <DayRing done={done} total={total} />
          <DayRing done={done} total={missions.length} />
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
      {progress && (
        <section className="card" aria-label="Zielfortschritt">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Target className="h-4 w-4 text-accent" aria-hidden /> Dein Ziel: {goalLabel(progress.goal)} · {progress.label}
          </p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-bg" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-1 text-right text-sm font-semibold">{progress.percent} %</p>
        </section>
      )}

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
      <section aria-labelledby="heute">
        <h2 id="heute" className="mb-3 font-display text-2xl font-semibold">Heutige Missionen</h2>
        {msg && <p role="alert" className="mb-3 text-sm text-red-400">{msg}</p>}
        {missions.length === 0 ? (
          <EmptyState icon={Target} title="Missionen werden geladen" text="Falls nichts erscheint, lade die Seite neu." />
        ) : (
          <ul className="grid gap-3">
            {missions.map((m) => <MissionCard key={m.id} m={m} busy={busy === m.id} onComplete={complete} />)}
          </ul>
        )}
</section>
</div>
);
