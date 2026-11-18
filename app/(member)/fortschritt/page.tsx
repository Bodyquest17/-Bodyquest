
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Dumbbell,
  Flame,
  Lock,
  Scale,
  Star,
  Target,
  Trophy,
} from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { getSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";

type Stats = Record<string, number>;

type Day = {
  date: string;
  done: number;
  total: number;
};

type Def = {
  key: string;
  title: string;
  description: string;
  icon: string;
  metric: string;
  threshold: number;
};

const METRICS = [
  { key: "weight_kg", label: "Gewicht", unit: "kg" },
  { key: "body_fat_pct", label: "Körperfett", unit: "%" },
  { key: "waist_cm", label: "Taille", unit: "cm" },
  { key: "chest_cm", label: "Brust", unit: "cm" },
  { key: "arm_cm", label: "Arm", unit: "cm" },
  { key: "thigh_cm", label: "Oberschenkel", unit: "cm" },
  { key: "resting_hr", label: "Ruhepuls", unit: "bpm" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

type MeasurementForm = Record<MetricKey, string> & {
  note: string;
};

type Row = {
  log_date: string;
  note?: string | null;
} & Partial<Record<MetricKey, number | null>>;

const ICONS = {
  flame: Flame,
  dumbbell: Dumbbell,
  trophy: Trophy,
  star: Star,
  target: Target,
  scale: Scale,
} as const;

const EMPTY_FORM: MeasurementForm = {
  weight_kg: "",
  body_fat_pct: "",
  waist_cm: "",
  chest_cm: "",
  arm_cm: "",
  thigh_cm: "",
  resting_hr: "",
  note: "",
};

function parseNumber(value: string): number | null {
  const cleaned = value.trim().replace(",", ".");

  if (!cleaned) return null;

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : NaN;
}

function latestValues(rows: Row[]): MeasurementForm {
  const result = { ...EMPTY_FORM };

  for (const metric of METRICS) {
    const found = [...rows]
      .reverse()
      .find(
        (row) =>
          row[metric.key] !== null &&
          row[metric.key] !== undefined
      );

    if (found) {
      result[metric.key] = String(found[metric.key]);
    }
  }

  return result;
}

function Chart({
  rows,
  metric,
  unit,
}: {
  rows: Row[];
  metric: MetricKey;
  unit: string;
}) {
  const points = rows
    .filter(
      (row) =>
        row[metric] !== null &&
        row[metric] !== undefined
    )
    .map((row) => ({
      date: row.log_date,
      value: Number(row[metric]),
    }))
    .filter((point) => Number.isFinite(point.value));

  if (points.length < 2) {
    return (
      <p className="text-sm text-muted">
        Trage mindestens zwei Messungen an
        unterschiedlichen Tagen ein, um deinen
        Verlauf zu sehen.
      </p>
    );
  }

  const min = Math.min(...points.map((p) => p.value));
  const max = Math.max(...points.map((p) => p.value));
  const span = max - min || 1;

  const x = (index: number) =>
    10 + (index / (points.length - 1)) * 280;

  const y = (value: number) =>
    120 - ((value - min) / span) * 100;

  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(
          point.value
        ).toFixed(1)}`
    )
    .join(" ");

  const first = points[0].value;
  const last = points[points.length - 1].value;
  const difference = last - first;

  return (
    <div className="grid gap-2">
      <svg
        viewBox="0 0 300 140"
        className="w-full"
        role="img"
        aria-label={`Verlauf ${metric}`}
      >
        <path
          d={path}
          fill="none"
          stroke="#B7F34B"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, index) => (
          <circle
            key={`${point.date}-${index}`}
            cx={x(index)}
            cy={y(point.value)}
            r="4"
            fill="#B7F34B"
          />
        ))}
      </svg>

      <div className="flex justify-between gap-2 text-xs text-muted">
        <span>
          Start: {first} {unit}
        </span>

        <span>
          Jetzt: {last} {unit}
        </span>

        <span className="font-semibold text-white">
          {difference > 0 ? "+" : ""}
          {difference.toFixed(1)} {unit}
        </span>
      </div>
    </div>
  );
}

export default function FortschrittPage() {
  const { loading, profile, error } = useProfile({
    requireOnboarding: true,
  });

  const [stats, setStats] = useState<Stats>({});
  const [week, setWeek] = useState<Day[]>([]);
  const [defs, setDefs] = useState<Def[]>([]);
  const [earned, setEarned] = useState<Set<string>>(
    new Set()
  );

  const [rows, setRows] = useState<Row[]>([]);
  const [fresh, setFresh] = useState<string[]>([]);

  const [metric, setMetric] =
    useState<MetricKey>("weight_kg");

  const [form, setForm] =
    useState<MeasurementForm>({ ...EMPTY_FORM });

  const [dirty, setDirty] = useState<
    Set<MetricKey>
  >(new Set());

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const load = useCallback(
    async (refreshForm = true) => {
      const sb = getSupabase();

      const [s, w, d, e, r] = await Promise.all([
        sb.rpc("user_stats"),
        sb.rpc("week_overview"),
        sb
          .from("achievement_defs")
          .select("*")
          .order("sort"),
        sb
          .from("user_achievements")
          .select("key"),
        sb
          .from("body_measurements")
          .select("*")
          .order("log_date", {
            ascending: true,
          }),
      ]);

      if (r.error) {
        setMsg(
          `Körperdaten konnten nicht geladen werden: ${r.error.message}`
        );
      } else {
        const measurements = (r.data ?? []) as Row[];

        setRows(measurements);

        if (refreshForm) {
          setForm(latestValues(measurements));
          setDirty(new Set());
        }
      }

      if (!s.error && s.data) {
        setStats(s.data as Stats);
      }

      if (!w.error && w.data) {
        setWeek(w.data as Day[]);
      }

      if (!d.error) {
        setDefs((d.data ?? []) as Def[]);
      }

      if (!e.error) {
        setEarned(
          new Set(
            ((e.data ?? []) as { key: string }[])
              .map((item) => item.key)
          )
        );
      }

      setLoadingData(false);
    },
    []
  );

  useEffect(() => {
    if (!profile?.onboarding_done) return;

    let cancelled = false;

    async function initialize() {
      await load();

      if (cancelled) return;

      const result = await getSupabase().rpc(
        "check_achievements"
      );

      if (
        !cancelled &&
        !result.error &&
        Array.isArray(result.data) &&
        result.data.length
      ) {
        setFresh(
          (
            result.data as { title: string }[]
          ).map((item) => item.title)
        );
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [profile?.onboarding_done, load]);

  function changeField(
    key: MetricKey,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setDirty((previous) => {
      const next = new Set(previous);
      next.add(key);
      return next;
    });

    setMsg("");
  }

  async function save() {
    if (busy) return;

    const payload: Record<string, unknown> = {};

    for (const key of dirty) {
      const value = parseNumber(form[key]);

      if (value === null) continue;

      if (!Number.isFinite(value)) {
        setMsg(
          "Bitte gib nur gültige Zahlen ein."
        );
        return;
      }

      if (value < 0) {
        setMsg(
          "Körperwerte dürfen nicht negativ sein."
        );
        return;
      }

      payload[key] = value;
    }

    if (form.note.trim()) {
      payload.note = form.note.trim();
    }

    if (Object.keys(payload).length === 0) {
      setMsg(
        "Ändere mindestens einen Wert oder füge eine Notiz hinzu."
      );
      return;
    }

    setBusy(true);
    setMsg("");

    try {
      const sb = getSupabase();

      const { error: saveError } = await sb.rpc(
        "log_measurements",
        { p: payload }
      );

      if (saveError) {
        throw new Error(saveError.message);
      }

      const { data, error: reloadError } = await sb
        .from("body_measurements")
        .select("*")
        .order("log_date", {
          ascending: true,
        });

      if (reloadError) {
        throw new Error(
          `Messung gespeichert, aber erneutes Laden fehlgeschlagen: ${reloadError.message}`
        );
      }

      const measurements = (data ?? []) as Row[];

      setRows(measurements);
      setForm(latestValues(measurements));
      setDirty(new Set());

      setMsg(
        "Körperdaten erfolgreich gespeichert!"
      );

      await load(false);
    } catch (err) {
      setMsg(
        err instanceof Error
          ? `Fehler: ${err.message}`
          : "Speichern fehlgeschlagen."
      );
    } finally {
      setBusy(false);
    }
  }

  const unit = useMemo(
    () =>
      METRICS.find((item) => item.key === metric)
        ?.unit ?? "",
    [metric]
  );

  if (loading) {
    return (
      <p className="text-muted">
        Wird geladen...
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-red-400">
        {error}
      </p>
    );
  }

  const field = (
    key: MetricKey,
    label: string
  ) => (
    <label className="grid gap-1 text-sm text-muted">
      {label}

      <input
        className="field"
        inputMode="decimal"
        value={form[key]}
        disabled={busy || loadingData}
        onChange={(event) =>
          changeField(key, event.target.value)
        }
      />
    </label>
  );

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Mein Weg"
        subtitle="Dein Fortschritt und deine Erfolge auf einen Blick."
      />

      {fresh.length > 0 && (
        <p
          role="status"
          className="card animate-xpPop border border-accent/40 text-center"
        >
          <span className="font-display text-2xl font-bold text-accent">
            Neuer Erfolg!
          </span>

          <span className="block">
            {fresh.join(", ")}
          </span>
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          ["Missionen", stats.missions_total],
          ["Aktive Tage", stats.active_days],
          ["Beste Serie", stats.streak],
        ].map(([label, value]) => (
          <section
            key={label as string}
            className="card"
          >
            <p className="font-display text-3xl font-bold leading-none">
              {value ?? 0}
            </p>

            <p className="mt-1 text-xs text-muted">
              {label}
            </p>
          </section>
        ))}
      </div>

      <section
        className="card"
        aria-label="Wochenplaner"
      >
        <h2 className="mb-3 font-display text-2xl font-semibold">
          Diese Woche
        </h2>

        <ul className="grid grid-cols-7 gap-1 text-center">
          {week.map((day) => {
            const full =
              day.total > 0 &&
              day.done === day.total;

            return (
              <li
                key={day.date}
                className="grid gap-1"
              >
                <span className="text-xs text-muted">
                  {new Date(
                    day.date + "T12:00:00"
                  ).toLocaleDateString("de-DE", {
                    weekday: "short",
                  })}
                </span>

                <span
                  className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${
                    full
                      ? "bg-accent text-bg"
                      : day.done > 0
                      ? "border border-accent"
                      : "bg-bg text-muted"
                  }`}
                >
                  {day.total > 0
                    ? `${day.done}/${day.total}`
                    : "–"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        className="card grid gap-3"
        aria-label="Körperdaten eintragen"
      >
        <h2 className="font-display text-2xl font-semibold">
          Körperdaten eintragen
        </h2>

        <p className="text-sm text-muted">
          Deine letzten gespeicherten Werte
          werden automatisch geladen.
          Leere Felder überschreiben
          keine bestehenden Werte.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {field("weight_kg", "Gewicht (kg)")}
          {field("body_fat_pct", "Körperfett (%)")}
          {field("waist_cm", "Taille (cm)")}
          {field("chest_cm", "Brust (cm)")}
          {field("arm_cm", "Arm (cm)")}
          {field("thigh_cm", "Oberschenkel (cm)")}
          {field("resting_hr", "Ruhepuls (bpm)")}
        </div>

        <label className="grid gap-1 text-sm text-muted">
          Notiz (optional)

          <input
            className="field"
            maxLength={300}
            value={form.note}
            disabled={busy || loadingData}
            onChange={(event) => {
              setForm((previous) => ({
                ...previous,
                note: event.target.value,
              }));
              setMsg("");
            }}
          />
        </label>

        <button
          className="btn-primary"
          disabled={busy || loadingData}
          onClick={save}
        >
          {busy
            ? "Wird gespeichert..."
            : loadingData
            ? "Daten werden geladen..."
            : "Körperdaten speichern"}
        </button>

        {msg && (
          <p
            role="status"
            className="text-center text-sm text-muted"
          >
            {msg}
          </p>
        )}
      </section>

      <section
        className="card grid gap-3"
        aria-label="Verlauf"
      >
        <h2 className="font-display text-2xl font-semibold">
          Verlauf
        </h2>

        <div className="flex flex-wrap gap-2">
          {METRICS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={
                metric === item.key
              }
              onClick={() =>
                setMetric(item.key)
              }
              className={`rounded-full border px-3 py-2 text-sm ${
                metric === item.key
                  ? "border-accent bg-accent/10"
                  : "border-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <Chart
          rows={rows}
          metric={metric}
          unit={unit}
        />
      </section>

      <section aria-label="Erfolge">
        <h2 className="mb-3 font-display text-2xl font-semibold">
          Erfolge ({earned.size}/{defs.length})
        </h2>

        <ul className="grid grid-cols-2 gap-3">
          {defs.map((definition) => {
            const got = earned.has(
              definition.key
            );

            const Icon = got
              ? ICONS[
                  definition.icon as keyof typeof ICONS
                ] ?? Trophy
              : Lock;

            const current = Math.min(
              stats[definition.metric] ?? 0,
              definition.threshold
            );

            return (
              <li
                key={definition.key}
                className={`card grid gap-1 ${
                  got
                    ? "border border-accent/40"
                    : "opacity-60"
                }`}
              >
                <Icon
                  className={`h-7 w-7 ${
                    got
                      ? "text-accent"
                      : "text-muted"
                  }`}
                  aria-hidden
                />

                <p className="font-semibold leading-tight">
                  {definition.title}
                </p>

                <p className="text-xs text-muted">
                  {definition.description}
                </p>

                {!got && (
                  <p className="text-xs text-muted">
                    {current} /{" "}
                    {definition.threshold}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
