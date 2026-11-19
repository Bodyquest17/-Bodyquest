"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { MissionCard, type Mission } from "@/components/MissionCard";
import { getSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { GOALS, SLOGAN } from "@/lib/goals";

type Targets = { calorie_target: number; protein_target_g: number; tdee: number; adjustment: number } | null;
const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));

export default function OnboardingPage() {
  const router = useRouter();
  const { loading, user, profile, error } = useProfile();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [secondary, setSecondary] = useState<string[]>([]);
  const [age, setAge] = useState(""); const [height, setHeight] = useState("");
  const [weight, setWeight] = useState(""); const [target, setTarget] = useState("");
  const [sex, setSex] = useState(""); const [level, setLevel] = useState("anfaenger");
  const [days, setDays] = useState(3); const [minutes, setMinutes] = useState("");
  const [location, setLocation] = useState(""); const [limits, setLimits] = useState("");
  const [diet, setDiet] = useState(""); const [allergies, setAllergies] = useState("");
  const [calories, setCalories] = useState(""); const [protein, setProtein] = useState("");
  const [targets, setTargets] = useState<Targets>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { if (profile?.onboarding_done && step < 4) router.replace("/dashboard"); }, [profile, step, router]);

  // Schritt 3: vorsichtige Schätzung
  useEffect(() => {
    if (step !== 3) return;
    const w = num(weight), h = num(height), a = num(age);
    if (!w || !h || !a || !goal) { setTargets(null); return; }
    void getSupabase().rpc("calc_targets", {
      p_weight: w, p_height: h, p_age: a, p_sex: sex || null, p_days: days, p_goal: goal,
    }).then(({ data }) => setTargets(data as Targets));
  }, [step, weight, height, age, sex, days, goal]);

  function toggleSecondary(k: string) {
    setSecondary((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  }

  function validateStep2(): string {
    const chk = (v: string, min: number, max: number, name: string) => {
      const n = num(v);
      return n !== null && (isNaN(n) || n < min || n > max) ? `${name}: bitte einen Wert zwischen ${min} und ${max} eingeben.` : "";
    };
    return chk(age, 14, 100, "Alter") || chk(height, 100, 250, "Größe") || chk(weight, 30, 300, "Gewicht")
      || chk(target, 30, 300, "Wunschgewicht") || chk(minutes, 10, 240, "Trainingszeit");
  }

  async function finish() {
    setSaving(true); setErr("");
    const sb = getSupabase();
    const payload: Record<string, unknown> = {
      goal_primary: goal, goals_secondary: secondary.filter((k) => k !== goal),
      fitness_level: level, days_per_week: days,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      username: (user?.user_metadata?.display_name as string | undefined) ?? undefined,
    };
    const put = (k: string, v: unknown) => { if (v !== null && v !== "" && v !== undefined) payload[k] = v; };
    put("age", num(age)); put("height_cm", num(height)); put("weight_kg", num(weight));
    put("target_weight_kg", num(target)); put("sex", sex); put("minutes_per_session", num(minutes));
    put("training_location", location); put("limitations", limits.trim()); put("diet_type", diet);
    put("allergies", allergies.trim()); put("calorie_target", num(calories)); put("protein_target_g", num(protein));

    const r = await sb.rpc("complete_onboarding", { p: payload });
    if (r.error) { setSaving(false); setErr(r.error.message); return; }
    const m = await sb.rpc("get_today_missions");
    setSaving(false);
    if (m.error) { setErr(m.error.message); return; }
    setMissions((m.data ?? []) as Mission[]);
    setStep(4);
  }

  if (loading) return <p className="p-6 text-muted">Wird geladen...</p>;
  if (error) return <p role="alert" className="p-6 text-red-400">{error}</p>;

  const chip = (on: boolean) => `rounded-xl border px-4 py-3 text-left ${on ? "border-accent bg-accent/10" : "border-white/10 bg-surface"}`;

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <Logo />
      <p className="mt-1 text-xs font-semibold tracking-wide text-accent">{SLOGAN}</p>
      <p className="mt-4 text-sm text-muted" aria-live="polite">Schritt {step} von 4</p>
      <div className="mb-5 mt-1 h-1.5 rounded-full bg-surface"><div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${step * 25}%` }} /></div>

      {step === 1 && (
        <section className="grid gap-4">
          <h1 className="font-display text-4xl font-bold leading-none">Was strebst du an?</h1>
          <p className="text-muted">Lass uns gemeinsam dein Ziel erreichen. Wähle dein Hauptziel:</p>
          <div className="grid gap-2" role="radiogroup" aria-label="Hauptziel">
            {GOALS.map((g) => (
              <button key={g.key} role="radio" aria-checked={goal === g.key} className={chip(goal === g.key)} onClick={() => setGoal(g.key)}>
                <span className="block font-semibold">{g.label}</span><span className="text-sm text-muted">{g.desc}</span>
              </button>
            ))}
          </div>
          {goal && (
            <>
              <p className="text-muted">Zusätzliche Nebenziele (optional):</p>
              <div className="flex flex-wrap gap-2">
                {GOALS.filter((g) => g.key !== goal).map((g) => (
                  <button key={g.key} aria-pressed={secondary.includes(g.key)} onClick={() => toggleSecondary(g.key)}
                    className={`rounded-full border px-3 py-2 text-sm ${secondary.includes(g.key) ? "border-accent bg-accent/10" : "border-white/10"}`}>{g.label}</button>
                ))}
              </div>
            </>
          )}
          <button className="btn-primary" disabled={!goal} onClick={() => setStep(2)}>Weiter</button>
        </section>
      )}

      {step === 2 && (
        <section className="grid gap-4">
          <h1 className="font-display text-4xl font-bold leading-none">Dein aktueller Stand</h1>
          <p className="text-sm text-muted">Alle Angaben sind freiwillig und standardmäßig privat. Je mehr du angibst, desto besser passen deine Missionen.</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm text-muted">Alter<input className="field" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} /></label>
            <label className="grid gap-1 text-sm text-muted">Größe (cm)<input className="field" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} /></label>
            <label className="grid gap-1 text-sm text-muted">Gewicht (kg)<input className="field" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
            <label className="grid gap-1 text-sm text-muted">Wunschgewicht (kg)<input className="field" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
          </div>
          <label className="grid gap-1 text-sm text-muted">Geschlecht (für die Kalorienschätzung)
            <select className="field" value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="">Keine Angabe</option><option value="m">Männlich</option><option value="w">Weiblich</option><option value="d">Divers</option>
            </select></label>
          <label className="grid gap-1 text-sm text-muted">Trainingserfahrung
            <select className="field" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="anfaenger">Anfänger</option><option value="fortgeschritten">Fortgeschritten</option><option value="profi">Profi</option>
            </select></label>
          <label className="grid gap-1 text-sm text-muted">Trainingstage pro Woche: {days}
            <input type="range" min={1} max={7} value={days} onChange={(e) => setDays(Number(e.target.value))} /></label>
          <label className="grid gap-1 text-sm text-muted">Zeit pro Training (Minuten)<input className="field" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></label>
          <label className="grid gap-1 text-sm text-muted">Trainingsort
            <select className="field" value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">Keine Angabe</option><option value="gym">Gym</option><option value="zuhause">Zuhause</option><option value="outdoor">Outdoor</option>
            </select></label>
          <label className="grid gap-1 text-sm text-muted">Körperliche Einschränkungen (optional)
            <input className="field" value={limits} onChange={(e) => setLimits(e.target.value)} /></label>
          {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-ghost" onClick={() => setStep(1)}>Zurück</button>
            <button className="btn-primary" onClick={() => { const v = validateStep2(); setErr(v); if (!v) setStep(3); }}>Weiter</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="grid gap-4">
          <h1 className="font-display text-4xl font-bold leading-none">Deine Ernährung</h1>
          <label className="grid gap-1 text-sm text-muted">Ernährungsweise
            <select className="field" value={diet} onChange={(e) => setDiet(e.target.value)}>
              <option value="">Keine Angabe</option><option value="alles">Alles</option><option value="vegetarisch">Vegetarisch</option>
              <option value="vegan">Vegan</option><option value="pescetarisch">Pescetarisch</option><option value="low_carb">Low Carb</option>
            </select></label>
          <label className="grid gap-1 text-sm text-muted">Allergien / Unverträglichkeiten (optional)
            <input className="field" value={allergies} onChange={(e) => setAllergies(e.target.value)} /></label>
          <div className="card">
            <h2 className="font-display text-xl font-semibold">Vorsichtige Schätzung</h2>
            {targets ? (
              <p className="mt-1 text-sm text-muted">Bei etwa {targets.tdee} kcal Tagesbedarf empfehlen wir{" "}
                <strong className="text-white">{targets.calorie_target} kcal</strong> und{" "}
                <strong className="text-white">{targets.protein_target_g} g Protein</strong>.
                Das ist eine Richtgröße, keine ärztliche Empfehlung.</p>
            ) : <p className="mt-1 text-sm text-muted">Trage in Schritt 2 Alter, Größe und Gewicht ein, dann schätzen wir deinen Bedarf.</p>}
          </div>
          <p className="text-sm text-muted">Du kennst deine Werte schon? Dann trage sie hier ein (sonst gilt die Schätzung):</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm text-muted">Kalorienziel<input className="field" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} /></label>
            <label className="grid gap-1 text-sm text-muted">Protein (g)<input className="field" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} /></label>
          </div>
          {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-ghost" onClick={() => setStep(2)}>Zurück</button>
            <button className="btn-primary" disabled={saving} onClick={finish}>{saving ? "Plan wird erstellt..." : "Plan erstellen"}</button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="grid gap-4">
          <h1 className="font-display text-4xl font-bold leading-none">Dein Missionsplan</h1>
          <p className="text-muted">Das sind deine ersten Missionen für heute. Jeden Tag kommen neue dazu, passend zu deinem Ziel.</p>
          <ul className="grid gap-3">{missions.map((m) => <MissionCard key={m.id} m={m} busy={false} />)}</ul>
          <button className="btn-primary" onClick={() => router.push("/dashboard")}>Los geht&apos;s</button>
        </section>
      )}
    </main>
  );
}
