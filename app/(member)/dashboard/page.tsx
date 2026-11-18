"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flame, ImagePlus, PartyPopper, Target, X, CheckCircle2, Clock3 } from "lucide-react";
import { XpBar } from "@/components/XpBar";
import { DayRing } from "@/components/DayRing";
import { EmptyState } from "@/components/EmptyState";
import { MissionCard, type Mission } from "@/components/MissionCard";
import { getSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { SLOGAN, goalLabel, rankForLevel } from "@/lib/goals";

type Progress = { percent: number; label: string; goal: string; goal_reached: boolean };
type MissionWithNote = Mission & { rejection_note?: string | null };
const NEXT_GOALS = [
  { key: "gewicht_halten", label: "Gewicht halten" },
  { key: "muskelaufbau", label: "Muskeln aufbauen" },
  { key: "kraft", label: "Kraft verbessern" },
  { key: "leistung", label: "Neue Challenge" },
];
const isDone = (m: MissionWithNote) => m.status === "done" || m.status === "approved";
const clamp = (n: number) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));

export default function DashboardPage() {
  const { loading, profile, error, reload } = useProfile({ requireOnboarding: true });
  const [missions, setMissions] = useState<MissionWithNote[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<MissionWithNote | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    const sb = getSupabase();
    const [missionResult, goalResult] = await Promise.all([
      sb.rpc("get_today_missions"),
      sb.rpc("goal_progress"),
    ]);
    if (missionResult.error) {
      setMsg(`Missionen konnten nicht geladen werden: ${missionResult.error.message}`);
    } else {
      const list = (missionResult.data ?? []) as MissionWithNote[];
      setMissions(list);
      if (list.some((m) => m.status === "rejected")) {
        const notesResult = await sb.rpc("get_my_rejection_notes");
        if (!notesResult.error) {
          const notes = (notesResult.data ?? []) as { mission_id: string; rejection_note: string | null }[];
          const byId = new Map(notes.map((n) => [n.mission_id, n.rejection_note]));
          setMissions(list.map((m) => ({ ...m, rejection_note: byId.get(m.id) ?? null })));
        }
      }
    }
    if (!goalResult.error && goalResult.data) {
      setProgress(goalResult.data as Progress);
    } else {
      setProgress(null);
    }
  }, []);

  useEffect(() => {
    if (profile?.onboarding_done) void loadData();
  }, [profile?.onboarding_done, loadData]);

  function openUpload(id: string) {
    const mission = missions.find((m) => m.id === id);
    if (!mission || busy || !["open", "rejected"].includes(mission.status)) return;
    setSelectedMission(mission);
    setFile(null);
    setMsg("");
    setSuccess("");
  }

  function closeUpload() {
    if (busy) return;
    setSelectedMission(null);
    setFile(null);
  }

  async function submitProof() {
    if (!selectedMission || !file || busy) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMsg("Nur JPG, PNG oder WEBP erlaubt.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMsg("Das Bild darf maximal 10 MB groß sein.");
      return;
    }
    const missionId = selectedMission.id;
    setBusy(missionId);
    setMsg("");
    setSuccess("");
    try {
      const sb = getSupabase();
