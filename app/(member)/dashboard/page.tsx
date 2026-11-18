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

const NEXT_GOALS = [
  { key: "gewicht_halten", label: "Gewicht halten" },
  { key: "muskelaufbau", label: "Muskeln aufbauen" },
  { key: "kraft", label: "Kraft verbessern" },
  { key: "leistung", label: "Neue Challenge" },
];

export default function DashboardPage() {
  const { loading, profile, error, reload } = useProfile({ requireOnboarding: true });
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    const sb = getSupabase();
    const m = await sb.rpc("get_today_missions");
    if (m.error) { setMsg(m.error.message); return; }
    const list = (m.data ?? []) as Mission[];
    setMissions(list);

    if (list.some((mission) => mission.status === "rejected")) {
      const { data: notes, error: notesError } = await sb.rpc("get_my_rejection_notes");
      if (notesError) {
        console.error("Ablehnungsbegründungen:", notesError.message);
      } else {
        const noteMap = new Map<string, string | null>(
          (notes ?? []).map((n: { mission_id: string; rejection_note: string | null }) => [n.mission_id, n.rejection_note])
        );
        setMissions(list.map((mission) => ({ ...mission, rejection_note: noteMap.get(mission.id) ?? null })));
      }
    }

    const g = await sb.rpc("goal_progress");
    if (!g.error) setProgress(g.data as Progress);
  }, []);

  useEffect(() => {
    if (profile?.onboarding_done) void loadData();
  }, [profile?.onboarding_done, loadData]);

  function openUpload(id: string) {
    const mission = missions.find((m) => m.id === id);
    if (!mission || busy || (mission.status !== "open" && mission.status !== "rejected")) return;
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
      setMsg("Nur JPG, PNG oder WEBP erlaubt."); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMsg("Das Bild darf maximal 10 MB groß sein."); return;
    }

    const missionId = selectedMission.id;
    setBusy(missionId);
    setMsg("");
    setSuccess("");
    try {
      const sb = getSupabase();
      const { data: authData, error: authError } = await sb.auth.getUser();
      if (authError || !authData.user) throw new Error("Bitte melde dich erneut an.");

      const userId = authData.user.id;
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const imagePath = `${userId}/${missionId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await sb.storage.from("mission-proofs").upload(imagePath, file, {
