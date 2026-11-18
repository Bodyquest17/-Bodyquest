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

type Progress = {
  percent: number;
  label: string;
  goal: string;
  goal_reached: boolean;
};
type MissionWithNote = Mission & { rejection_note?: string | null };

const NEXT_GOALS = [
  { key: "gewicht_halten", label: "Gewicht halten" },
  { key: "muskelaufbau", label: "Muskeln aufbauen" },
  { key: "kraft", label: "Kraft verbessern" },
  { key: "leistung", label: "Neue Challenge" },
];

const isDone = (mission: MissionWithNote) =>
  mission.status === "done" || mission.status === "approved";

export default function DashboardPage() {
  const { loading, profile, error, reload } = useProfile({ requireOnboarding: true });
  const [missions, setMissions] = useState<MissionWithNote[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<MissionWithNote | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState("");
  const [goalBusy, setGoalBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    const sb = getSupabase();
    const result = await sb.rpc("get_today_missions");
    if (result.error) {
      setMsg(`Missionen konnten nicht geladen werden: ${result.error.message}`);
      return;
    }

    const list = (result.data ?? []) as MissionWithNote[];
    if (list.some((mission) => mission.status === "rejected")) {
      const notes = await sb.rpc("get_my_rejection_notes");
      if (!notes.error) {
        const byMission = new Map<string, string | null>(
          ((notes.data ?? []) as { mission_id: string; rejection_note: string | null }[])
            .map((note) => [note.mission_id, note.rejection_note])
        );
        setMissions(list.map((mission) => ({
          ...mission,
          rejection_note: byMission.get(mission.id) ?? mission.rejection_note ?? null,
        })));
      } else {
        setMissions(list);
      }
    } else {
      setMissions(list);
    }

    const goalResult = await sb.rpc("goal_progress");
    if (goalResult.error) {
      setProgress(null);
    } else {
      setProgress(goalResult.data as Progress);
    }
  }, []);

  useEffect(() => {
    if (profile?.onboarding_done) void loadData();
  }, [profile?.onboarding_done, loadData]);

  function openUpload(id: string) {
    const mission = missions.find((item) => item.id === id);
    if (!mission || busy) return;
    if (mission.status !== "open" && mission.status !== "rejected") return;
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
      setMsg("Bitte ein JPG-, PNG- oder WEBP-Bild auswählen.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMsg("Das Bild darf höchstens 10 MB groß sein.");
      return;
    }

    const missionId = selectedMission.id;
    setBusy(missionId);
    setMsg("");
    setSuccess("");
    try {
      const sb = getSupabase();
      const auth = await sb.auth.getUser();
      if (auth.error || !auth.data.user) throw new Error("Bitte melde dich erneut an.");
      const userId = auth.data.user.id;
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${missionId}/${crypto.randomUUID()}.${ext}`;
      const uploaded = await sb.storage.from("mission-proofs").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploaded.error) throw new Error(`Foto-Upload: ${uploaded.error.message}`);

      const submitted = await sb.rpc("submit_mission_proof", {
        p_mission_id: missionId,
        p_image_path: path,
      });
      if (submitted.error) {
        await sb.storage.from("mission-proofs").remove([path]);
        throw new Error(submitted.error.message);
      }

      setSelectedMission(null);
      setFile(null);
      setSuccess("Nachweis eingereicht! Nach der Adminfreigabe erhältst du deine XP.");
      await Promise.all([loadData(), reload()]);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Nachweis konnte nicht eingereicht werden.");
    } finally {
      setBusy(null);
    }
  }

  async function nextGoal(goal: string) {
    if (goalBusy) return;
    setGoalBusy(true);
    setMsg("");
    try {
      const result = await getSupabase().rpc("change_goal", { p_goal: goal });
      if (result.error) throw new Error(result.error.message);
      await Promise.all([loadData(), reload()]);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Ziel konnte nicht geändert werden.");
    } finally {
      setGoalBusy(false);
    }
  }

  if (loading) return <p className="text-muted">Wird geladen...</p>;
  if (error) return <p role="alert" className="text-red-400">{error}</p>;
  if (!profile) return null;

  const done = missions.filter(isDone).length;
  const pending = missions.filter((mission) => mission.status === "pending").length;
  const total = missions.length;
  const todayPercent = total > 0 ? Math.round((done / total) * 100) : 0;
  const goalPercent = progress ? Math.max(0, Math.min(100, Number(progress.percent) || 0)) : null;
  const motivation = todayPercent === 100
    ? "Alle heutigen Missionen geschafft. Stark!"
    : todayPercent >= 60
      ? "Du bist auf einem richtig guten Weg!"
      : todayPercent > 0
        ? "Starker Anfang! Jede bestätigte Mission zählt."
        : pending > 0
          ? "Deine Nachweise werden geprüft. Bleib dran!"
          : "Deine Reise beginnt mit der nächsten Mission.";

  return (
    <div className="grid gap-4">
      <header>
        <p className="text-muted">Hallo {profile.username ?? "Athlet"} · {rankForLevel(profile.level)}</p>
        <h1 className="font-display text-4xl font-bold leading-none">{SLOGAN}</h1>
      </header>

      {progress?.goal_reached && (
        <section className="card grid gap-3 border border-accent/40" aria-label="Ziel erreicht">
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
            <PartyPopper className="h-6 w-6 text-accent" aria-hidden /> Ziel erreicht!
          </h2>
          <p className="text-muted">Glückwunsch! Wähle deine nächste Herausforderung.</p>
          <div className="grid grid-cols-2 gap-2">
            {NEXT_GOALS.map((goal) => (
              <button key={goal.key} type="button" className="btn-ghost" disabled={goalBusy} onClick={() => void nextGoal(goal.key)}>
                {goal.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <XpBar xp={profile.total_xp} />

      <div className="grid grid-cols-2 gap-4">
        <section className="card flex items-center gap-3" aria-label="Streak">
          <Flame className="h-9 w-9 text-accent" aria-hidden />
          <div>
            <p className="font-display text-3xl font-bold leading-none">{profile.streak}</p>
            <p className="text-sm text-muted">Tage in Folge</p>
          </div>
        </section>
        <section className="card flex items-center justify-center" aria-label="Tagesfortschritt">
          <DayRing done={done} total={total} />
        </section>
      </div>

      <section className="card grid gap-4" aria-label="Zielfortschritt">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-accent" aria-hidden />
          <h2 className="font-display text-2xl font-bold">Dein Ziel</h2>
        </div>
        <div>
          <p className="text-lg font-bold text-accent">{goalLabel(profile.goal_primary)}</p>
          <p className="text-sm text-muted">Jede Mission bringt dich deinem Ziel näher!</p>
        </div>
        <div className="rounded-xl bg-bg p-4">
          <p className="font-semibold">{motivation}</p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-sm text-muted">Heute geschafft</span>
            <span className="font-display text-2xl font-bold text-accent">{todayPercent} %</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Heutige Missionen" aria-valuemin={0} aria-valuemax={100} aria-valuenow={todayPercent}>
            <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${todayPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">
            {done} von {total} Missionen bestätigt{pending > 0 ? ` · ${pending} in Prüfung` : ""}
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Dein langfristiges Ziel</h3>
            <span className="font-display text-xl font-bold">{goalPercent === null ? "–" : `${goalPercent} %`}</span>
          </div>
          <p className="mt-1 text-xs text-muted">{progress?.label ?? "Zielfortschritt derzeit nicht verfügbar"}</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-bg" role="progressbar" aria-label="Langfristiger Zielfortschritt" aria-valuemin={0} aria-valuemax={100} aria-valuenow={goalPercent ?? 0}>
            <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${goalPercent ?? 0}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">Dieser Wert kommt aus deiner Zielberechnung. Trainingskonstanz und körperliche Veränderung sind nicht dasselbe.</p>
        </div>
      </section>

      <section aria-labelledby="heute">
        <h2 id="heute" className="mb-3 font-display text-2xl font-semibold">Heutige Missionen</h2>
        {msg && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{msg}</p>}
        {success && <p role="status" className="mb-3 rounded-xl bg-green-500/10 p-3 text-sm text-green-400">{success}</p>}
        {missions.length === 0 ? (
          <EmptyState icon={Target} title="Noch keine Missionen" text="Falls nichts erscheint, lade die Seite neu." />
        ) : (
          <ul className="grid gap-3">
            {missions.map((mission) => (
              <MissionCard key={mission.id} m={mission} busy={busy === mission.id} onComplete={openUpload} />
            ))}
          </ul>
        )}
      </section>

      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="dashboard-proof-title" className="card w-full max-w-md space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="dashboard-proof-title" className="font-display text-2xl font-semibold">Mission nachweisen</h2>
                <p className="mt-1 text-sm text-muted">{selectedMission.title}</p>
              </div>
              <button type="button" onClick={closeUpload} disabled={Boolean(busy)} aria-label="Schließen"><X className="h-6 w-6" /></button>
            </div>
            <p className="text-sm text-white/80">Lade ein Foto oder einen Screenshot hoch. Nach der Adminfreigabe erhältst du deine XP.</p>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setMsg(""); }} />
            <button type="button" className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/30 p-6 text-center" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)}>
              <ImagePlus className="h-9 w-9 text-accent" />
              <span className="text-sm font-semibold">{file ? file.name : "Foto oder Screenshot auswählen"}</span>
              <span className="text-xs text-muted">JPG, PNG oder WEBP · maximal 10 MB</span>
            </button>
            {msg && <p role="alert" className="text-sm text-red-400">{msg}</p>}
            <button type="button" className="btn-primary w-full" disabled={!file || Boolean(busy)} onClick={() => void submitProof()}>
              {busy ? "Nachweis wird hochgeladen..." : "Nachweis zur Prüfung einreichen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
