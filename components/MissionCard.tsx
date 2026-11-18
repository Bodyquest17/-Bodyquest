
"use client";

import {
  Activity, Apple, Check, Dumbbell, Moon,
  Target, Lightbulb, Clock, XCircle, Camera
} from "lucide-react";

import {
  CATEGORY_LABEL,
  DIFFICULTY_LABEL
} from "@/lib/goals";

export type Mission = {
  id: string;
  mission_date: string;
  category: string;
  title: string;
  description: string;
  difficulty: number;
  xp: number;
  status: "open" | "pending" | "approved" | "rejected" | "done";
  why: string | null;
};

const ICONS = {
  kraft: Dumbbell,
  cardio: Activity,
  ernaehrung: Apple,
  regeneration: Moon,
  disziplin: Target
} as const;

export function MissionCard({
  m,
  busy,
  onComplete
}: {
  m: Mission;
  busy: boolean;
  onComplete?: (id: string) => void;
}) {
  const Icon = ICONS[m.category as keyof typeof ICONS] ?? Target;

  const done = m.status === "done" || m.status === "approved";
  const pending = m.status === "pending";
  const rejected = m.status === "rejected";

  return (
    <li className={`card grid gap-3 ${done ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-1 h-7 w-7 shrink-0 text-accent" aria-hidden />

        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">
            {CATEGORY_LABEL[m.category] ?? m.category}
            {" · "}
            {DIFFICULTY_LABEL[m.difficulty]}
            {" · "}
            {m.xp} XP
          </p>

          <h3 className="font-display text-2xl font-semibold leading-tight">
            {m.title}
          </h3>

          <p className="mt-1 text-sm text-white/90">
            {m.description}
          </p>
        </div>
      </div>

      {m.why && (
        <p className="flex gap-2 rounded-xl bg-bg p-3 text-sm text-muted">
          <Lightbulb
            className="mt-0.5 h-4 w-4 shrink-0 text-accent"
            aria-hidden
          />
          <span>
            <strong className="text-white">Warum?</strong> {m.why}
          </span>
        </p>
      )}

      {done && (
        <p className="flex items-center gap-2 font-semibold text-accent">
          <Check className="h-5 w-5" />
          Genehmigt · +{m.xp} XP
        </p>
      )}

      {pending && (
        <p className="flex items-center gap-2 font-semibold text-yellow-400">
          <Clock className="h-5 w-5" />
          Nachweis wird geprüft
        </p>
      )}

      {rejected && (
        <p className="flex items-center gap-2 font-semibold text-red-400">
          <XCircle className="h-5 w-5" />
          Nachweis abgelehnt
        </p>
      )}

      {onComplete && !done && !pending && (
        <button
          className="btn-primary flex items-center justify-center gap-2"
          disabled={busy}
          onClick={() => onComplete(m.id)}
        >
          <Camera className="h-5 w-5" />
          {busy
            ? "Bitte warten..."
            : rejected
              ? "Neuen Nachweis einreichen"
              : "Nachweis hochladen"}
        </button>
      )}
    </li>
  );
}
