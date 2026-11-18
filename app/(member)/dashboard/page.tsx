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
        <div className="flex items-start gap-2">
          <Target className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div>
            <h2 className="font-display text-2xl font-semibold">Dein Ziel: {goalLabel(progress?.goal ?? profile.goal_primary)}</h2>
            <p className="text-sm text-muted">Jede bestätigte Mission bringt dich deinem Ziel näher.</p>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Heute geschafft</p>
              <p className="text-xs text-muted">Vom Admin bestätigte Tagesmissionen</p>
            </div>
            <p className="font-display text-2xl font-bold text-accent">{done}/{total}</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-bg" role="progressbar" aria-label="Bestätigte Tagesmissionen" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dayPercent}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${dayPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>{dayPercent}% heute abgeschlossen</span>
            <span>{Math.max(0, total - done)} noch nicht bestätigt</span>
          </div>
          {pending > 0 && (
            <p className="flex items-center gap-2 text-xs text-muted"><Clock3 className="h-4 w-4" aria-hidden />{pending} Nachweis{pending === 1 ? "" : "e"} wartet{pending === 1 ? "" : "n"} auf Adminprüfung</p>
          )}
          {total > 0 && done === total && (
            <p className="flex items-center gap-2 text-sm text-accent"><CheckCircle2 className="h-4 w-4" aria-hidden />Alle heutigen Missionen bestätigt!</p>
          )}
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Langfristiger Zielfortschritt</p>
              <p className="text-xs text-muted">{progress?.label ?? "Noch keine Zielauswertung verfügbar"}</p>
            </div>
            <span className="font-display text-xl font-bold">{progress ? `${Math.round(goalPercent)}%` : "–"}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-bg" role="progressbar" aria-label="Langfristiger Zielfortschritt" aria-valuemin={0} aria-valuemax={100} aria-valuenow={goalPercent}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${goalPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">Dieser Wert kommt aus deiner Zielberechnung in Supabase. Tagesmissionen und tatsächliche Körperentwicklung sind unterschiedliche Messgrößen.</p>
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
            {missions.map((m) => <MissionCard key={m.id} m={m} busy={busy === m.id} onComplete={openUpload} />)}
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
            <p className="text-sm text-white/80">Lade ein Foto oder einen Screenshot hoch, der deine erledigte Mission zeigt. XP erhältst du nach der Adminfreigabe.</p>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setMsg(""); }} />
            <button type="button" className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/30 p-6 text-center" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)}>
              <ImagePlus className="h-9 w-9 text-accent" />
              <span className="text-sm font-semibold">{file ? file.name : "Foto oder Screenshot auswählen"}</span>
              <span className="text-xs text-muted">JPG, PNG oder WEBP · Maximal 10 MB</span>
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
