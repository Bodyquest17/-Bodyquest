"use client";

import { useEffect, useState } from "react";
import { Droplets, Footprints, Moon, NotebookPen, Save } from "lucide-react";

type DayData = {
  steps: number;
  waterMl: number;
  sleepMinutes: number;
  note: string;
};
const EMPTY: DayData = { steps: 0, waterMl: 0, sleepMinutes: 0, note: "" };
const STEPS_GOAL = 10000;
const WATER_GOAL = 2500;
const SLEEP_GOAL = 480;

function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function percent(value: number, goal: number) {
  return Math.min(100, Math.max(0, Math.round((value / goal) * 100)));
}
function ProgressBar({ value, goal, label }: { value: number; goal: number; label: string }) {
  const pct = percent(value, goal);
  return (
    <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10"
      role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function HealthPage() {
  const [date, setDate] = useState("");
  const [data, setData] = useState<DayData>(EMPTY);
  const [stepsInput, setStepsInput] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sleepMins, setSleepMins] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const day = localDate();
    setDate(day);
    try {
      const stored = localStorage.getItem(`bodyquest-health:${day}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<DayData>;
        setData({
          steps: Math.max(0, Number(parsed.steps) || 0),
          waterMl: Math.max(0, Number(parsed.waterMl) || 0),
          sleepMinutes: Math.max(0, Number(parsed.sleepMinutes) || 0),
          note: typeof parsed.note === "string" ? parsed.note : "",
        });
      }
    } catch {
      setMessage("Gespeicherte Daten konnten nicht geladen werden.");
    }
    setReady(true);
  }, []);

  function save(next: DayData) {
    setData(next);
    try {
      localStorage.setItem(`bodyquest-health:${date}`, JSON.stringify(next));
      setMessage("Auf diesem Gerät gespeichert.");
    } catch {
      setMessage("Speichern fehlgeschlagen. Bitte Browser-Speicher prüfen.");
    }
  }

  function saveSteps() {
    const n = Number(stepsInput);
    if (!Number.isInteger(n) || n < 0 || n > 200000 || stepsInput.trim() === "") {
      setMessage("Bitte eine gültige Schrittzahl von 0 bis 200.000 eingeben.");
      return;
    }
    save({ ...data, steps: n });
    setStepsInput("");
  }

  function saveSleep() {
    const h = Number(sleepHours || "0");
    const m = Number(sleepMins || "0");
    if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 24 || m < 0 || m > 59 || h * 60 + m > 1440) {
      setMessage("Bitte eine gültige Schlafdauer eingeben.");
      return;
    }
    save({ ...data, sleepMinutes: h * 60 + m });
  }

  if (!ready) return <p className="text-muted">Health wird geladen...</p>;

  return (
    <main className="grid gap-5">
      <header className="grid gap-2">
        <h1 className="font-display text-3xl font-bold">BodyQuest Health</h1>
        <p className="text-muted">Jede Mission bringt dich deinem Ziel näher! · {date}</p>
        <p className="text-sm text-muted">
          Beta: Manuelle Erfassung im Browser. Noch keine Apple-Health-/Android-Verbindung,
          automatische Schrittzählung, Push-Erinnerung oder XP-Vergabe.
        </p>
      </header>
      {message && <p role="status" className="text-sm text-accent">{message}</p>}

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Footprints className="text-accent" /> Schritte</h2>
        <p className="text-2xl font-bold">{data.steps.toLocaleString("de-DE")} <span className="text-sm font-normal text-muted">/ {STEPS_GOAL.toLocaleString("de-DE")}</span></p>
        <ProgressBar value={data.steps} goal={STEPS_GOAL} label="Schrittziel" />
        <div className="flex gap-2">
          <input className="min-w-0 flex-1 rounded-xl border border-white/20 bg-transparent p-3"
            aria-label="Heutige Schritte" type="number" min={0} max={200000} inputMode="numeric"
            placeholder="Schritte heute" value={stepsInput} onChange={(e) => setStepsInput(e.target.value)} />
          <button className="btn-primary" type="button" onClick={saveSteps}>Speichern</button>
        </div>
      </section>

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Droplets className="text-accent" /> Wasser</h2>
        <p className="text-2xl font-bold">{(data.waterMl / 1000).toLocaleString("de-DE")} L <span className="text-sm font-normal text-muted">/ {(WATER_GOAL / 1000).toLocaleString("de-DE")} L</span></p>
        <ProgressBar value={data.waterMl} goal={WATER_GOAL} label="Trinkziel" />
        <div className="flex flex-wrap gap-2">
          {[150, 250, 500].map((ml) => (
            <button key={ml} type="button" className="btn-ghost" onClick={() => save({ ...data, waterMl: data.waterMl + ml })}>+{ml} ml</button>
          ))}
          <button type="button" className="btn-ghost" disabled={data.waterMl === 0}
            onClick={() => save({ ...data, waterMl: Math.max(0, data.waterMl - 250) })}>−250 ml</button>
        </div>
      </section>

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Moon className="text-accent" /> Schlaf</h2>
        <p className="text-2xl font-bold">{Math.floor(data.sleepMinutes / 60)} h {data.sleepMinutes % 60} min <span className="text-sm font-normal text-muted">/ 8 h</span></p>
        <ProgressBar value={data.sleepMinutes} goal={SLEEP_GOAL} label="Schlafziel" />
        <div className="flex flex-wrap items-center gap-2">
          <input className="w-24 rounded-xl border border-white/20 bg-transparent p-3" aria-label="Stunden Schlaf"
            type="number" min={0} max={24} placeholder="Stunden" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} />
          <input className="w-24 rounded-xl border border-white/20 bg-transparent p-3" aria-label="Minuten Schlaf"
            type="number" min={0} max={59} placeholder="Minuten" value={sleepMins} onChange={(e) => setSleepMins(e.target.value)} />
          <button type="button" className="btn-primary" onClick={saveSleep}>Speichern</button>
        </div>
        <p className="text-xs text-muted">Für einen zuverlässigen Weckalarm bitte den Handywecker verwenden.</p>
      </section>

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><NotebookPen className="text-accent" /> Meine Notizen</h2>
        <textarea className="min-h-28 w-full rounded-xl border border-white/20 bg-transparent p-3"
          aria-label="Tagesnotiz" maxLength={2000} placeholder="Wie lief dein Tag? Training, Ernährung, Motivation ..."
          value={data.note} onChange={(e) => setData((old) => ({ ...old, note: e.target.value }))} />
        <button className="btn-primary flex items-center justify-center gap-2" type="button"
          onClick={() => save(data)}><Save size={18} /> Notiz speichern</button>
      </section>
      <p className="text-xs text-muted">
        Datenschutz: Diese Beta speichert Daten nur im Browser dieses Geräts, nicht in Supabase.
        Browserdaten löschen oder Gerät wechseln kann Einträge verlieren. Keine automatische Synchronisierung.
      </p>
    </main>
  );
}
