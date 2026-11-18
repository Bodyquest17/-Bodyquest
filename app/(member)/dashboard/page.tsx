"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flame, ImagePlus, PartyPopper, Target, X } from "lucide-react";
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

function Bar({ value, label }: { value: number; label: string }) {
  const safe = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div className="h-3 overflow-hidden rounded-full bg-bg" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${safe}%` }} />
    </div>
  );
}

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
    const result = await sb.rpc("get_today_missions");
    if (result.error) {
      setMsg(result.error.message);
      return;
    }
    const list = (result.data ?? []) as MissionWithNote[];
    if (list.some((m) => m.status === "rejected")) {
      const notes = await sb.rpc("get_my_rejection_notes");
      if (!notes.error) {
        const noteMap = new Map<string, string | null>(
          ((notes.data ?? []) as { mission_id: string; rejection_note: string | null }[])
            .map((n) => [n.mission_id, n.rejection_note])
        );
        setMissions(list.map((m) => ({ ...m, rejection_note: noteMap.get(m.id) ?? null })));
      } else {
        setMissions(list);
      }
    } else {
      setMissions(list);
    }
    const goal = await sb.rpc("goal_progress");
    if (!goal.error && goal.data) setProgress(goal.data as Progress);
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
    if (inputRef.current) inputRef.current.value = "";
  }

  function closeUpload() {
    if (busy) return;
    setSelectedMission(null);
    setFile(null);
    setMsg("");
  }

  async function submitProof() {
    if (!selectedMission || !file || busy) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMsg("Bitte JPG, PNG oder WEBP auswählen.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
