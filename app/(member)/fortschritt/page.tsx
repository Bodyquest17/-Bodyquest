"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dumbbell, Flame, Lock, Scale, Star, Target, Trophy } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";

type Stats = Record<string, number>;
type Day = { date: string; done: number; total: number };
type Def = { key: string; title: string; description: string; icon: string; metric: string; threshold: number };
type Row = Record<string, number | string | null> & { log_date: string };

const ICONS = { flame: Flame, dumbbell: Dumbbell, trophy: Trophy, star: Star, target: Target, scale: Scale } as const;
const METRICS = [
  { key: "weight_kg", label: "Gewicht", unit: "kg" },
  { key: "body_fat_pct", label: "Körperfett", unit: "%" },
  { key: "waist_cm", label: "Taille", unit: "cm" },
  { key: "chest_cm", label: "Brust", unit: "cm" },
  { key: "arm_cm", label: "Arm", unit: "cm" },
  { key: "thigh_cm", label: "Oberschenkel", unit: "cm" },
  { key: "resting_hr", label: "Ruhepuls", unit: "bpm" },
] as const;
const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));

function Chart({ rows, metric, unit }: { rows: Row[]; metric: string; unit: string }) {
  const pts = rows.filter((r) => r[metric] !== null && r[metric] !== undefined).map((r) => ({ d: r.log_date, v: Number(r[metric]) }));
  if (pts.length < 2) return <p className="text-sm text-muted">Trage mindestens zwei Werte ein, dann siehst du hier deinen Verlauf.</p>;
  const min = Math.min(...pts.map((p) => p.v)), max = Math.max(...pts.map((p) => p.v));
  const span = max - min || 1;
  const x = (i: number) => 10 + (i / (pts.length - 1)) * 280;
  const y = (v: number) => 120 - ((v - min) / span) * 100;
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const diff = pts[pts.length - 1].v - pts[0].v;
  return (
    <div>
      <svg viewBox="0 0 300 140" className="w-full" role="img" aria-label={`Verlauf ${metric}`}>
        <path d={path} fill="none" stroke="#B7F34B" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={p.d} cx={x(i)} cy={y(p.v)} r="4" fill="#B7F34B" />)}
      </svg>
      <p className="mt-1 flex justify-between text-sm text-muted">
        <span>Start: {pts[0].v} {unit}</span>
        <span>Jetzt: {pts[pts.length - 1].v} {unit}</span>
        <span className="font-semibold text-white">{diff > 0 ? "+" : ""}{diff.toFixed(1)} {unit}</span>
      </p>
    </div>
  );
}

export default function FortschrittPage() {
  const { loading, profile, error } = useProfile({ requireOnboarding: true });
  const [stats, setStats] = useState<Stats>({});
  const [week, setWeek] = useState<Day[]>([]);
  const [defs, setDefs] = useState<Def[]>([]);
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<Row[]>([]);
  const [fresh, setFresh] = useState<string[]>([]);
  const [metric, setMetric] = useState<string>("weight_kg");
  const [form, setForm] = useState({ weight_kg: "", body_fat_pct: "", waist_cm: "", chest_cm: "", arm_cm: "", thigh_cm: "", resting_hr: "", note: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase();
    const ach = await sb.rpc("check_achievements");
    if (!ach.error && Array.isArray(ach.data) && ach.data.length) setFresh((ach.data as { title: string }[]).map((a) => a.title));
    const [s, w, d, e, r] = await Promise.all([
      sb.rpc("user_stats"), sb.rpc("week_overview"),
      sb.from("achievement_defs").select("*").order("sort"),
      sb.from("user_achievements").select("key"),
      sb.from("body_measurements").select("*").order("log_date", { ascending: true }),
    ]);
    if (s.data) setStats(s.data as Stats);
    if (w.data) setWeek(w.data as Day[]);
    setDefs((d.data ?? []) as Def[]);
    setEarned(new Set(((e.data ?? []) as { key: string }[]).map((x) => x.key)));
    setRows((r.data ?? []) as Row[]);
  }, []);

  useEffect(() => { if (profile?.onboarding_done) void load(); }, [profile?.onboarding_done, load]);

  async function save() {
    const p: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form) as [string, string][]) {
      if (k === "note") { if (v.trim()) p.note = v.trim(); continue; }
      const n = num(v);
      if (n !== null) { if (isNaN(n)) { setMsg("Bitte nur Zahlen eingeben."); return; } p[k] = n; }
    }
    if (Object.keys(p).length === 0) { setMsg("Trage mindestens einen Wert ein."); return; }
    setBusy(true); setMsg("");
    const { error: e } = await getSupabase().rpc("log_measurements", { p });
    setBusy(false);
    if (e) { setMsg(`Fehler: ${e.message}`); return; }
    setForm({ weight_kg: "", body_fat_pct: "", waist_cm: "", chest_cm: "", arm_cm: "", thigh_cm: "", resting_hr: "", note: "" });
    setMsg("Gespeichert.");
    await load();
  }

  const unit = useMemo(() => METRICS.find((m) => m.key === metric)?.unit ?? "", [metric]);

  if (loading) return <p className="text-muted">Wird geladen...</p>;
  if (error) return <p role="alert" className="text-red-400">{error}</p>;

  const field = (k: keyof typeof form, label: string) => (
    <label className="grid gap-1 text-sm text-muted">{label}
      <input className="field" inputMode="decimal" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
  );

  return (
    <div className="grid gap-4">
      <PageHeader title="Mein Weg" subtitle="Dein Fortschritt und deine Erfolge auf einen Blick." />

      {fresh.length > 0 && (
        <p role="status" className="card animate-xpPop border border-accent/40 text-center">
          <span className="font-display text-2xl font-bold text-accent">Neuer Erfolg!</span>
          <span className="block">{fresh.join(", ")}</span>
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        {[["Missionen", stats.missions_total], ["Aktive Tage", stats.active_days], ["Beste Serie", stats.streak]].map(([l, v]) => (
          <section key={l as string} className="card">
            <p className="font-display text-3xl font-bold leading-none">{v ?? 0}</p>
            <p className="mt-1 text-xs text-muted">{l}</p>
          </section>
        ))}
      </div>

      <section className="card" aria-label="Wochenplaner">
        <h2 className="mb-3 font-display text-2xl font-semibold">Diese Woche</h2>
        <ul className="grid grid-cols-7 gap-1 text-center">
          {week.map((d) => {
            const full = d.total > 0 && d.done === d.total;
            return (
              <li key={d.date} className="grid gap-1">
                <span className="text-xs text-muted">{new Date(d.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short" })}</span>
                <span className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${full ? "bg-accent text-bg" : d.done > 0 ? "border border-accent" : "bg-bg text-muted"}`}>
                  {d.total > 0 ? `${d.done}/${d.total}` : "–"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card grid gap-3" aria-label="Körperdaten eintragen">
        <h2 className="font-display text-2xl font-semibold">Körperdaten eintragen</h2>
        <p className="text-sm text-muted">Alles optional und privat. Leere Felder bleiben unverändert.</p>
        <div className="grid grid-cols-2 gap-3">
          {field("weight_kg", "Gewicht (kg)")}{field("body_fat_pct", "Körperfett (%)")}
          {field("waist_cm", "Taille (cm)")}{field("chest_cm", "Brust (cm)")}
          {field("arm_cm", "Arm (cm)")}{field("thigh_cm", "Oberschenkel (cm)")}
          {field("resting_hr", "Ruhepuls (bpm)")}
        </div>
        <label className="grid gap-1 text-sm text-muted">Notiz (optional)
          <input className="field" maxLength={300} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
        <button className="btn-primary" disabled={busy} onClick={save}>{busy ? "Wird gespeichert..." : "Speichern"}</button>
        {msg && <p role="status" className="text-center text-sm text-muted">{msg}</p>}
      </section>

      <section className="card grid gap-3" aria-label="Verlauf">
        <h2 className="font-display text-2xl font-semibold">Verlauf</h2>
        <div className="flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <button key={m.key} aria-pressed={metric === m.key} onClick={() => setMetric(m.key)}
              className={`rounded-full border px-3 py-2 text-sm ${metric === m.key ? "border-accent bg-accent/10" : "border-white/10"}`}>{m.label}</button>
          ))}
        </div>
        <Chart rows={rows} metric={metric} unit={unit} />
      </section>

      <section aria-label="Erfolge">
        <h2 className="mb-3 font-display text-2xl font-semibold">Erfolge ({earned.size}/{defs.length})</h2>
        <ul className="grid grid-cols-2 gap-3">
          {defs.map((d) => {
            const got = earned.has(d.key);
            const Icon = got ? (ICONS[d.icon as keyof typeof ICONS] ?? Trophy) : Lock;
            const cur = Math.min(stats[d.metric] ?? 0, d.threshold);
            return (
              <li key={d.key} className={`card grid gap-1 ${got ? "border border-accent/40" : "opacity-60"}`}>
                <Icon className={`h-7 w-7 ${got ? "text-accent" : "text-muted"}`} aria-hidden />
                <p className="font-semibold leading-tight">{d.title}</p>
                <p className="text-xs text-muted">{d.description}</p>
                {!got && <p className="text-xs text-muted">{cur} / {d.threshold}</p>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
