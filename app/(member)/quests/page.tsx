
"use client";

import { useEffect, useRef, useState } from "react";
import { History, ImagePlus, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MissionCard, type Mission } from "@/components/MissionCard";
import { getSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";

export default function QuestsPage() {
  const { loading, profile, error } = useProfile({
    requireOnboarding: true
  });

  const [today, setToday] = useState<Mission[]>([]);
  const [past, setPast] = useState<Mission[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const sb = getSupabase();

    const t = await sb.rpc("get_today_missions");

    if (t.error) {
      setMsg(t.error.message);
      return;
    }

    const list = (t.data ?? []) as Mission[];
    setToday(list);

    const date = list[0]?.mission_date;

    if (date) {
      const h = await sb
        .from("daily_missions")
        .select("*")
        .lt("mission_date", date)
        .order("mission_date", { ascending: false })
        .limit(60);

      if (h.error) {
        setMsg(h.error.message);
      } else {
        setPast((h.data ?? []) as Mission[]);
      }
    }
  }

  useEffect(() => {
    if (profile?.onboarding_done) {
      void load();
    }
  }, [profile?.onboarding_done]);

  function openUpload(id: string) {
    const mission = today.find((m) => m.id === id);

    if (!mission) return;

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
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Foto-Upload: ${uploadError.message}`);
      }

      const { error: proofError } = await sb.rpc(
        "submit_mission_proof",
        {
          p_mission_id: missionId,
          p_image_path: imagePath
        }
      );

      if (proofError) {
        // Hochgeladenes Foto bei fehlgeschlagener
        // Einreichung möglichst wieder entfernen.
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

      await load();
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

  const byDate = past.reduce<Record<string, Mission[]>>(
    (acc, m) => {
      (acc[m.mission_date] ??= []).push(m);
      return acc;
    },
    {}
  );

  return (
    <>
      <PageHeader
        title="Quests"
        subtitle="Jede Mission bringt dich deinem Ziel näher!"
      />

      {msg && (
        <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
          {msg}
        </p>
      )}

      {success && (
        <p role="status" className="mb-3 rounded-xl bg-green-500/10 p-3 text-sm text-green-400">
          {success}
        </p>
      )}

      <ul className="grid gap-3">
        {today.map((m) => (
          <MissionCard
            key={m.id}
            m={m}
            busy={busy === m.id}
            onComplete={openUpload}
          />
        ))}
      </ul>

      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="proof-dialog-title"
            className="card w-full max-w-md space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="proof-dialog-title"
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
              Nach der Prüfung erhältst du deine XP.
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
                {file ? file.name : "Foto oder Screenshot auswählen"}
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

      <h2 className="mb-3 mt-8 font-display text-2xl font-semibold">
        Verlauf
      </h2>

      {Object.keys(byDate).length === 0 ? (
        <EmptyState
          icon={History}
          title="Noch kein Verlauf"
          text="Ab morgen siehst du hier deine vergangenen Missionen."
        />
      ) : (
        (Object.entries(byDate) as [string, Mission[]][]).map(
          ([date, list]) => (
            <section key={date} className="card mb-3">
              <h3 className="mb-2 font-semibold">
                {new Date(`${date}T12:00:00`).toLocaleDateString(
                  "de-DE",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long"
                  }
                )}
              </h3>

              <ul className="grid gap-1 text-sm">
                {list.map((m) => (
                  <li
                    key={m.id}
                    className="flex justify-between gap-3"
                  >
                    <span>{m.title}</span>

                    <span
                      className={
                        m.status === "done"
                          ? "text-accent"
                          : "text-muted"
                      }
                    >
                      {m.status === "done"
                        ? `+${m.xp} XP`
                        : m.status === "pending"
                          ? "In Prüfung"
                          : m.status === "rejected"
                            ? "Abgelehnt"
                            : "Offen"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )
        )
      )}
    </>
  );
}
