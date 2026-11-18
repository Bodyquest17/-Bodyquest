"use client";

import { useEffect, useState } from "react";
import {
  Droplets, Footprints, Moon, NotebookPen, Save,
  Utensils, Pill, Plus, Trash2, ChevronLeft, ChevronRight,
} from "lucide-react";

type MealType = "Frühstück" | "Mittagessen" | "Abendessen" | "Snacks";
type Meal = {
  id: string;
  type: MealType;
  name: string;
  amount: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};
type Supplement = {
  id: string;
  name: string;
  dose: string;
  time: string;
  taken: boolean;
};
type DayData = {
  steps: number;
  waterMl: number;
  sleepMinutes: number;
  note: string;
  meals: Meal[];
  supplements: Supplement[];
};
const EMPTY = (): DayData => ({
  steps: 0, waterMl: 0, sleepMinutes: 0, note: "",
  meals: [], supplements: [],
});
const MEAL_TYPES: MealType[] = ["Frühstück", "Mittagessen", "Abendessen", "Snacks"];
const STEPS_GOAL = 10000;
const WATER_GOAL = 2500;
const SLEEP_GOAL = 480;
const fieldClass = "min-w-0 w-full rounded-xl border border-white/20 bg-transparent p-3";
function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function shiftDate(day: string, offset: number) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function percent(value: number, goal: number) {
  return Math.min(100, Math.max(0, Math.round((value / goal) * 100)));
}
function safeNumber(value: unknown, max = 1000000) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0;
}
function normalize(raw: unknown): DayData {
  if (!raw || typeof raw !== "object") return EMPTY();
  const p = raw as Partial<DayData>;
  return {
    steps: safeNumber(p.steps, 200000),
    waterMl: safeNumber(p.waterMl, 100000),
    sleepMinutes: safeNumber(p.sleepMinutes, 1440),
    note: typeof p.note === "string" ? p.note : "",
    meals: Array.isArray(p.meals) ? p.meals.filter((x): x is Meal =>
      !!x && typeof x.id === "string" && typeof x.name === "string" &&
      MEAL_TYPES.includes(x.type)
    ).map(x => ({
      ...x, kcal: safeNumber(x.kcal), protein: safeNumber(x.protein),
      carbs: safeNumber(x.carbs), fat: safeNumber(x.fat),
    })) : [],
    supplements: Array.isArray(p.supplements) ? p.supplements.filter((x): x is Supplement =>
      !!x && typeof x.id === "string" && typeof x.name === "string"
    ).map(x => ({ ...x, taken: Boolean(x.taken) })) : [],
  };
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
function sum(meals: Meal[], field: "kcal" | "protein" | "carbs" | "fat") {
  return meals.reduce((total, meal) => total + meal[field], 0);
}
function format(n: number) {
  return n.toLocaleString("de-DE", { maximumFractionDigits: 1 });
}

export default function HealthPage() {
  const [date, setDate] = useState("");
  const [data, setData] = useState<DayData>(EMPTY);
  const [stepsInput, setStepsInput] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sleepMins, setSleepMins] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [mealType, setMealType] = useState<MealType>("Frühstück");
  const [mealName, setMealName] = useState("");
  const [mealAmount, setMealAmount] = useState("");
  const [mealKcal, setMealKcal] = useState("");
  const [mealProtein, setMealProtein] = useState("");
  const [mealCarbs, setMealCarbs] = useState("");
  const [mealFat, setMealFat] = useState("");
  const [suppName, setSuppName] = useState("");
  const [suppDose, setSuppDose] = useState("");
  const [suppTime, setSuppTime] = useState("");

  useEffect(() => { setDate(localDate()); }, []);
  useEffect(() => {
    if (!date) return;
    setReady(false);
    try {
      const stored = localStorage.getItem(`bodyquest-health:${date}`);
      setData(stored ? normalize(JSON.parse(stored)) : EMPTY());
      setMessage("");
    } catch {
      setData(EMPTY());
      setMessage("Gespeicherte Daten konnten nicht geladen werden.");
    }
    setStepsInput("");
    setSleepHours("");
    setSleepMins("");
    setReady(true);
  }, [date]);

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
  function addMeal() {
    if (!mealName.trim()) {
      setMessage("Bitte ein Lebensmittel oder Gericht eingeben.");
      return;
    }
    const raw = [mealKcal, mealProtein, mealCarbs, mealFat];
    if (raw.some(x => x.trim() === "" || !Number.isFinite(Number(x)) || Number(x) < 0 || Number(x) > 100000)) {
      setMessage("Bitte gültige Kalorien und Makros eingeben (auch 0 ist erlaubt).");
      return;
    }
    const meal: Meal = {
      id: crypto.randomUUID(), type: mealType, name: mealName.trim(),
      amount: mealAmount.trim(), kcal: Number(mealKcal),
      protein: Number(mealProtein), carbs: Number(mealCarbs), fat: Number(mealFat),
    };
    save({ ...data, meals: [...data.meals, meal] });
    setMealName(""); setMealAmount(""); setMealKcal("");
    setMealProtein(""); setMealCarbs(""); setMealFat("");
  }
  function addSupplement() {
    if (!suppName.trim()) {
      setMessage("Bitte den Namen des Supplements eingeben.");
      return;
    }
    save({
      ...data,
      supplements: [...data.supplements, {
        id: crypto.randomUUID(), name: suppName.trim(),
        dose: suppDose.trim(), time: suppTime, taken: false,
      }],
    });
    setSuppName(""); setSuppDose(""); setSuppTime("");
  }

  if (!ready) return <p className="text-muted">Health wird geladen...</p>;
  return (
    <main className="grid gap-5">
      <header className="grid gap-2">
        <h1 className="font-display text-3xl font-bold">BodyQuest Health</h1>
        <p className="text-muted">Dein persönliches Fitness-Tagebuch – ohne XP und Nachweispflicht.</p>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-2">
          <button type="button" className="btn-ghost" aria-label="Vorheriger Tag" onClick={() => setDate(shiftDate(date, -1))}><ChevronLeft /></button>
          <label className="text-sm font-semibold">
            <span className="sr-only">Tagebuchdatum</span>
            <input type="date" value={date} max={localDate()} onChange={e => { if (e.target.value) setDate(e.target.value); }}
              className="max-w-[160px] bg-transparent text-center" />
          </label>
          <button type="button" className="btn-ghost" aria-label="Nächster Tag"
            disabled={date >= localDate()} onClick={() => setDate(shiftDate(date, 1))}><ChevronRight /></button>
        </div>
      </header>
      {message && <p role="status" className="text-sm text-accent">{message}</p>}

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Footprints className="text-accent" /> Schritte</h2>
        <p className="text-2xl font-bold">{data.steps.toLocaleString("de-DE")} <span className="text-sm font-normal text-muted">/ {STEPS_GOAL.toLocaleString("de-DE")}</span></p>
        <ProgressBar value={data.steps} goal={STEPS_GOAL} label="Schrittziel" />
        <div className="flex gap-2">
          <input className={fieldClass} aria-label="Schritte" type="number" min={0} max={200000}
            inputMode="numeric" placeholder="Schritte" value={stepsInput} onChange={e => setStepsInput(e.target.value)} />
          <button className="btn-primary" type="button" onClick={saveSteps}>Speichern</button>
        </div>
      </section>

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Droplets className="text-accent" /> Wasser</h2>
        <p className="text-2xl font-bold">{format(data.waterMl / 1000)} L <span className="text-sm font-normal text-muted">/ {format(WATER_GOAL / 1000)} L</span></p>
        <ProgressBar value={data.waterMl} goal={WATER_GOAL} label="Trinkziel" />
        <div className="flex flex-wrap gap-2">
          {[150, 250, 500].map(ml => (
            <button key={ml} type="button" className="btn-ghost"
              onClick={() => save({ ...data, waterMl: Math.min(100000, data.waterMl + ml) })}>+{ml} ml</button>
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
            type="number" min={0} max={24} placeholder="Stunden" value={sleepHours} onChange={e => setSleepHours(e.target.value)} />
          <input className="w-24 rounded-xl border border-white/20 bg-transparent p-3" aria-label="Minuten Schlaf"
            type="number" min={0} max={59} placeholder="Minuten" value={sleepMins} onChange={e => setSleepMins(e.target.value)} />
          <button type="button" className="btn-primary" onClick={saveSleep}>Speichern</button>
        </div>
      </section>

      <section className="card grid gap-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Utensils className="text-accent" /> Ernährung</h2>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["Kalorien", "kcal", sum(data.meals, "kcal")],
            ["Protein", "g", sum(data.meals, "protein")],
            ["Kohlenhydrate", "g", sum(data.meals, "carbs")],
            ["Fett", "g", sum(data.meals, "fat")],
          ] as const).map(([label, unit, value]) => (
            <div key={label} className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-muted">{label}</p>
              <p className="text-xl font-bold">{format(value)} <span className="text-xs font-normal text-muted">{unit}</span></p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">Die Werte werden aus deinen Eingaben addiert. Keine automatische Lebensmitteldatenbank.</p>
        {MEAL_TYPES.map(type => (
          <div key={type} className="grid gap-2 border-t border-white/10 pt-3">
            <h3 className="font-semibold">{type}</h3>
            {data.meals.filter(m => m.type === type).length === 0 && <p className="text-sm text-muted">Noch nichts eingetragen.</p>}
            {data.meals.filter(m => m.type === type).map(meal => (
              <div key={meal.id} className="flex items-start justify-between gap-2 rounded-xl bg-white/5 p-3">
                <div className="min-w-0">
                  <p className="font-semibold break-words">{meal.name}{meal.amount ? ` · ${meal.amount}` : ""}</p>
                  <p className="text-xs text-muted">{format(meal.kcal)} kcal · P {format(meal.protein)} g · KH {format(meal.carbs)} g · F {format(meal.fat)} g</p>
                </div>
                <button type="button" aria-label={`${meal.name} löschen`} className="text-muted"
                  onClick={() => save({ ...data, meals: data.meals.filter(m => m.id !== meal.id) })}><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        ))}
        <div className="grid gap-2 border-t border-white/10 pt-3">
          <h3 className="flex items-center gap-2 font-semibold"><Plus size={18} /> Mahlzeit hinzufügen</h3>
          <select aria-label="Mahlzeit" className={fieldClass} value={mealType} onChange={e => setMealType(e.target.value as MealType)}>
            {MEAL_TYPES.map(type => <option key={type} value={type} className="bg-zinc-900">{type}</option>)}
          </select>
          <input className={fieldClass} aria-label="Lebensmittel" placeholder="Lebensmittel / Gericht" maxLength={120}
            value={mealName} onChange={e => setMealName(e.target.value)} />
          <input className={fieldClass} aria-label="Menge" placeholder="Menge, z. B. 200 g (optional)" maxLength={60}
            value={mealAmount} onChange={e => setMealAmount(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            {([
              ["Kalorien (kcal)", mealKcal, setMealKcal],
              ["Protein (g)", mealProtein, setMealProtein],
              ["Kohlenhydrate (g)", mealCarbs, setMealCarbs],
              ["Fett (g)", mealFat, setMealFat],
            ] as const).map(([label, value, setter]) => (
              <label key={label} className="grid gap-1 text-xs text-muted">
                {label}
                <input className={fieldClass} type="number" min={0} max={100000} step="any" inputMode="decimal"
                  value={value} onChange={e => setter(e.target.value)} placeholder="0" />
              </label>
            ))}
          </div>
          <button type="button" className="btn-primary" onClick={addMeal}>Mahlzeit speichern</button>
        </div>
      </section>

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Pill className="text-accent" /> Supplements</h2>
        {data.supplements.length === 0 && <p className="text-sm text-muted">Noch keine Supplements für diesen Tag.</p>}
        {data.supplements.map(s => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <input type="checkbox" className="h-5 w-5 accent-lime-400" checked={s.taken}
              aria-label={`${s.name} eingenommen`} onChange={e => save({
                ...data, supplements: data.supplements.map(x => x.id === s.id ? { ...x, taken: e.target.checked } : x),
              })} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold break-words">{s.name}</p>
              <p className="text-xs text-muted">{[s.dose, s.time].filter(Boolean).join(" · ") || "Keine Angaben"}</p>
            </div>
            <button type="button" aria-label={`${s.name} löschen`} className="text-muted"
              onClick={() => save({ ...data, supplements: data.supplements.filter(x => x.id !== s.id) })}><Trash2 size={18} /></button>
          </div>
        ))}
        <div className="grid gap-2 border-t border-white/10 pt-3">
          <input className={fieldClass} aria-label="Supplementname" placeholder="Name, z. B. Kreatin" maxLength={100}
            value={suppName} onChange={e => setSuppName(e.target.value)} />
          <input className={fieldClass} aria-label="Dosierung" placeholder="Dosierung, z. B. 5 g (optional)" maxLength={60}
            value={suppDose} onChange={e => setSuppDose(e.target.value)} />
          <input className={fieldClass} aria-label="Einnahmezeit" type="time" value={suppTime} onChange={e => setSuppTime(e.target.value)} />
          <button type="button" className="btn-primary" onClick={addSupplement}>Supplement hinzufügen</button>
        </div>
        <p className="text-xs text-muted">Nur Dokumentation deiner Einnahme, keine Dosierungsempfehlung.</p>
      </section>

      <section className="card grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><NotebookPen className="text-accent" /> Meine Notizen</h2>
        <textarea className="min-h-28 w-full rounded-xl border border-white/20 bg-transparent p-3"
          aria-label="Tagesnotiz" maxLength={2000} placeholder="Wie lief dein Tag? Training, Ernährung, Motivation ..."
          value={data.note} onChange={e => setData(old => ({ ...old, note: e.target.value }))} />
        <button className="btn-primary flex items-center justify-center gap-2" type="button"
          onClick={() => save(data)}><Save size={18} /> Notiz speichern</button>
      </section>
      <p className="text-xs text-muted">
        Beta: Alle Einträge werden nur im Browser dieses Geräts gespeichert, nicht in Supabase.
        Browserdaten löschen oder Gerät wechseln kann Einträge verlieren. Keine automatische Synchronisierung,
        Tracker-Verbindung, Push-Erinnerung oder XP-Vergabe.
      </p>
    </main>
  );
}
