
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Flame,
  ImagePlus,
  PartyPopper,
  Target,
  X,
} from "lucide-react";
import { XpBar } from "@/components/XpBar";
import { DayRing } from "@/components/DayRing";
import { EmptyState } from "@/components/EmptyState";
import {
  MissionCard,
  type Mission,
} from "@/components/MissionCard";
import { getSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import {
  SLOGAN,
  goalLabel,
  rankForLevel,
} from "@/lib/goals";

type Progress = {
  percent: number;
  label: string;
  goal: string;
  goal_reached: boolean;
};

type MissionWithNote = Mission & {
  rejection_note?: string | null;
};

const NEXT_GOALS = [
  { key: "gewicht_halten", label: "Gewicht halten" },
  { key: "muskelaufbau", label: "Muskeln aufbauen" },
  { key: "kraft", label: "Kraft verbessern" },
  { key: "leistung", label: "Neue Challenge" },
];

export default function DashboardPage() {
  const { loading, profile, error, reload } = useProfile({
    requireOnboarding: true,
  });

  const [missions, setMissions] = useState<MissionWithNote[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [measurements, setMeasurements] = useState<{log_date: string; weight_kg: number | null; body_fat_pct: number | null}[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] =
    useState<MissionWithNote | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    const sb = getSupabase();

    const { data, error: missionError } =
      await sb.rpc("get_today_missions");

    if (missionError) {
      setMsg(missionError.message);
      return;
    }

    const list = (data ?? []) as MissionWithNote[];
    setMissions(list);

    if (list.some((m) => m.status === "rejected")) {
      const { data: notes, error: notesError } =
        await sb.rpc("get_my_rejection_notes");

      if (notesError) {
        console.error(
          "Ablehnungsbegründungen:",
          notesError.message
        );
      } else {
        const noteMap = new Map<string, string | null>(
          (
            (notes ?? []) as {
              mission_id: string;
              rejection_note: string | null;
            }[]
          ).map((n) => [
            n.mission_id,
            n.rejection_note,
          ])
        );
