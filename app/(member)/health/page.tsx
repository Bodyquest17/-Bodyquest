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
