
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

        setMissions(
          list.map((m) => ({
            ...m,
            rejection_note: noteMap.get(m.id) ?? null,
          }))
        );
      }
    }

    const goalResult = await sb.rpc("goal_progress");

    if (!goalResult.error) {
      setProgress(goalResult.data as Progress);
    }
  }, []);

  useEffect(() => {
    if (profile?.onboarding_done) {
      void loadData();
    }
  }, [profile?.onboarding_done, loadData]);

  function openUpload(id: string) {
    const mission = missions.find((m) => m.id === id);

    if (!mission || busy) return;

    if (
      mission.status !== "open" &&
      mission.status !== "rejected"
    ) {
      return;
    }

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

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      )
    ) {
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

      const { data: authData, error: authError } =
        await sb.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Bitte melde dich erneut an.");
      }

      const userId = authData.user.id;

      const extension =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "jpg";

      const imagePath =
        `${userId}/${missionId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await sb.storage
        .from("mission-proofs")
        .upload(imagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          `Foto-Upload: ${uploadError.message}`
        );
      }

      const { error: proofError } = await sb.rpc(
        "submit_mission_proof",
        {
          p_mission_id: missionId,
          p_image_path: imagePath,
        }
      );

      if (proofError) {
        await sb.storage
          .from("mission-proofs")
          .remove([imagePath]);

        throw new Error(proofError.message);
      }

      setSelectedMission(null);
      setFile(null);

      setSuccess(
        "Nachweis eingereicht! Dein Foto wartet auf die Adminprüfung."
      );

      await Promise.all([loadData(), reload()]);
    } catch (err) {
      setMsg(
        err instanceof Error
          ? err.message
          : "Ein Fehler ist aufgetreten."
      );
    } finally {
      setBusy(null);
    }
  }

  async function nextGoal(goal: string) {
    setMsg("");

    const { error: changeError } =
      await getSupabase().rpc("change_goal", {
        p_goal: goal,
      });

    if (changeError) {
      setMsg(changeError.message);
      return;
    }

    await Promise.all([loadData(), reload()]);
  }

  if (loading) {
    return <p className="text-muted">Wird geladen...</p>;
  }

  if (error) {
    return (
      <p role="alert" className="text-red-400">
        {error}
      </p>
    );
  }

  if (!profile) return null;

  const done = missions.filter(
    (m) => m.status === "done" || m.status === "approved"
  ).length;

  return (
    <div className="grid gap-4">
      <header>
        <p className="text-muted">
          Hallo {profile.username ?? "Athlet"} ·{" "}
          {rankForLevel(profile.level)}
        </p>

        <h1 className="font-display text-4xl font-bold leading-none">
          {SLOGAN}
        </h1>
      </header>

      {progress?.goal_reached && (
        <section
          className="card grid gap-3 border border-accent/40"
          aria-label="Ziel erreicht"
        >
          <p className="flex items-center gap-2 font-display text-2xl font-semibold">
            <PartyPopper
              className="h-6 w-6 text-accent"
              aria-hidden
            />
            Glückwunsch! Du hast dein Ziel erreicht.
          </p>

          <p className="text-muted">
            Was ist deine nächste Mission?
          </p>

          <div className="grid grid-cols-2 gap-2">
            {NEXT_GOALS.map((g) => (
              <button
                key={g.key}
                type="button"
                className="btn-ghost"
                onClick={() => void nextGoal(g.key)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <XpBar xp={profile.total_xp} />

      <div className="grid grid-cols-2 gap-4">
        <section
          className="card flex items-center gap-3"
          aria-label="Streak"
        >
          <Flame
            className="h-9 w-9 text-accent"
            aria-hidden
          />

          <div>
            <p className="font-display text-3xl font-bold leading-none">
              {profile.streak}
            </p>
            <p className="text-sm text-muted">
              Tage in Folge
            </p>
          </div>
        </section>

        <section
          className="card flex items-center justify-center"
          aria-label="Tagesfortschritt"
        >
          <DayRing
            done={done}
            total={missions.length}
          />
        </section>
      </div>

      {progress && (
        <section
          className="card"
          aria-label="Zielfortschritt"
        >
          <p className="flex items-center gap-2 text-sm text-muted">
            <Target
              className="h-4 w-4 text-accent"
              aria-hidden
            />
            Dein Ziel: {goalLabel(progress.goal)} ·{" "}
            {progress.label}
          </p>

          <div
            className="mt-2 h-3 overflow-hidden rounded-full bg-bg"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-700"
              style={{
                width: `${progress.percent}%`,
              }}
            />
          </div>

          <p className="mt-1 text-right text-sm font-semibold">
            {progress.percent} %
          </p>
        </section>
      )}

      <section aria-labelledby="heute">
        <h2
          id="heute"
          className="mb-3 font-display text-2xl font-semibold"
        >
          Heutige Missionen
        </h2>

        {msg && (
          <p
            role="alert"
            className="mb-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-400"
          >
            {msg}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="mb-3 rounded-xl bg-green-500/10 p-3 text-sm text-green-400"
          >
            {success}
          </p>
        )}

        {missions.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Noch keine Missionen"
            text="Falls nichts erscheint, lade die Seite neu."
          />
        ) : (
          <ul className="grid gap-3">
            {missions.map((m) => (
              <MissionCard
                key={m.id}
                m={m}
                busy={busy === m.id}
                onComplete={openUpload}
              />
            ))}
          </ul>
        )}
      </section>

      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-proof-title"
            className="card w-full max-w-md space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="dashboard-proof-title"
                  className="font-display text-2xl font-semibold"
                >
                  Mission nachweisen
                </h2>

                <p className="mt-1 text-sm text-muted">
                  {selectedMission.title}
                </p>
              </div>

              <button
                type="button"
                onClick={closeUpload}
                disabled={Boolean(busy)}
                aria-label="Schließen"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm text-white/80">
              Lade ein Foto oder einen Screenshot hoch,
              der zeigt, dass du die Mission erledigt hast.
              Nach der Adminprüfung erhältst du deine XP.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setMsg("");
              }}
            />

            <button
              type="button"
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/30 p-6 text-center"
              onClick={() => inputRef.current?.click()}
              disabled={Boolean(busy)}
            >
              <ImagePlus className="h-9 w-9 text-accent" />

              <span className="text-sm font-semibold">
                {file
                  ? file.name
                  : "Foto oder Screenshot auswählen"}
              </span>

              <span className="text-xs text-muted">
                JPG, PNG oder WEBP · Maximal 10 MB
              </span>
            </button>

            {msg && (
              <p role="alert" className="text-sm text-red-400">
                {msg}
              </p>
            )}

            <button
              type="button"
              className="btn-primary w-full"
              disabled={!file || Boolean(busy)}
              onClick={() => void submitProof()}
            >
              {busy
                ? "Nachweis wird hochgeladen..."
                : "Nachweis zur Prüfung einreichen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
