"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MissionCard, type Mission } from "@/components/MissionCard";
import { getSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";

export default function QuestsPage() {
  const { loading, profile, error } = useProfile({ requireOnboarding: true });
  const [today, setToday] = useState<Mission[]>([]);
  const [past, setPast] = useState<Mission[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const sb = getSupabase();
    const t = await sb.rpc("get_today_missions");
    if (t.error) { setMsg(t.error.message); return; }
    const list = (t.data ?? []) as Mission[];
    setToday(list);
    const date = list[0]?.mission_date;
    if (date) {
      const h = await sb.from("daily_missions").select("*").lt("mission_date", date)
        .order("mission_date", { ascending: false }).limit(60);
      setPast((h.data ?? []) as Mission[]);
    }
  }
  useEffect(() => { if (profile?.onboarding_done) void load(); }, [profile?.onboarding_done]);

  async function complete(id: string) {
    setBusy(id); setMsg("");
    const { error: e } = await getSupabase().rpc("complete_mission", { p_mission_id: id });
    setBusy(null);
    if (e) setMsg(e.message); else await load();
  }

  if (loading) return <p className="text-muted">Wird geladen...</p>;
  if (error) return <p role="alert" className="text-red-400">{error}</p>;

  const byDate = past.reduce<Record<string, Mission[]>>((acc, m) => { (acc[m.mission_date] ??= []).push(m); return acc; }, {});

  return (
    <>
      <PageHeader title="Quests" subtitle="Heute neu: Missionen, die zu deinem Ziel passen." />
      {msg && <p role="alert" className="mb-3 text-sm text-red-400">{msg}</p>}
      <ul className="grid gap-3">
        {today.map((m) => <MissionCard key={m.id} m={m} busy={busy === m.id} onComplete={complete} />)}
      </ul>

      <h2 className="mb-3 mt-8 font-display text-2xl font-semibold">Verlauf</h2>
      {Object.keys(byDate).length === 0 ? (
        <EmptyState icon={History} title="Noch kein Verlauf" text="Ab morgen siehst du hier deine vergangenen Missionen." />
      ) : (
        (Object.entries(byDate) as [string, Mission[]][]).map(([date, list]) => (
          <section key={date} className="card mb-3">
            <h3 className="mb-2 font-semibold">{new Date(date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</h3>
            <ul className="grid gap-1 text-sm">
              {list.map((m) => (
                <li key={m.id} className="flex justify-between gap-3">
                  <span>{m.title}</span>
                  <span className={m.status === "done" ? "text-accent" : "text-muted"}>{m.status === "done" ? `+${m.xp} XP` : "offen"}</span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
