
"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clock3, RefreshCw, ShieldAlert, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getSupabase } from "@/lib/supabase";

type Proof = {
  id: string;
  mission_id: string;
  user_id: string;
  image_path: string;
  created_at: string;
  status: string;
  title: string;
  xp: number;
  image_url: string | null;
};

export default function AdminHome() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const sb = getSupabase();

      const { data: admin, error: adminError } =
        await sb.rpc("is_bodyquest_admin");

      if (adminError || admin !== true) {
        setAuthorized(false);
        setProofs([]);
        return;
      }

      setAuthorized(true);

      const { data, error } = await sb
        .from("mission_proofs")
        .select("id,mission_id,user_id,image_path,created_at,status")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const items: Proof[] = [];

      for (const proof of data ?? []) {
        const { data: mission, error: missionError } = await sb
          .from("daily_missions")
          .select("title,xp")
          .eq("id", proof.mission_id)
          .single();

        if (missionError) throw missionError;

        const { data: signed, error: imageError } =
          await sb.storage
            .from("mission-proofs")
            .createSignedUrl(proof.image_path, 600);

        if (imageError) throw imageError;

        items.push({
          ...proof,
          title: mission.title,
          xp: mission.xp,
          image_url: signed?.signedUrl ?? null
        });
      }

      setProofs(items);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Fehler beim Laden."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(proof: Proof, approve: boolean) {
    let reason: string | null = null;

    if (!approve) {
      reason = window.prompt(
        "Warum wird dieser Nachweis abgelehnt?"
      );

      if (reason === null) return;

      if (!reason.trim()) {
        setMessage("Bitte einen Ablehnungsgrund eingeben.");
        return;
      }
    }

    setBusy(proof.id);
    setMessage("");

    try {
      const { data, error } = await getSupabase().rpc(
        "review_mission_proof",
        {
          p_proof_id: proof.id,
          p_approve: approve,
          p_rejection_note: reason
        }
      );

      if (error) throw error;

      setMessage(
        approve
          ? `Mission genehmigt. ${data?.xp_awarded ?? 0} XP vergeben.`
          : "Nachweis abgelehnt. Mitglied kann erneut einreichen."
      );

      await load();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Prüfung fehlgeschlagen."
      );
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <p className="text-muted">Adminbereich wird geladen...</p>;
  }

  if (!authorized) {
    return (
      <div className="card space-y-3">
        <ShieldAlert className="h-8 w-8 text-red-400" />
        <h1 className="text-2xl font-semibold">Zugriff verweigert</h1>
        <p className="text-muted">
          Dieser Bereich ist ausschließlich für BodyQuest-Admins.
          Melde dich mit deinem freigeschalteten Admin-Konto an.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Admin-Dashboard"
        subtitle="BodyQuest · Missionsnachweise prüfen"
      />

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="card flex items-center gap-3">
          <Clock3 className="h-6 w-6 text-accent" />
          <div>
            <p className="font-display text-3xl font-bold">
              {proofs.length}
            </p>
            <p className="text-sm text-muted">
              Offene Nachweise
            </p>
          </div>
        </div>

        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => void load()}
          disabled={Boolean(busy)}
        >
          <RefreshCw className="h-4 w-4" />
          Aktualisieren
        </button>
      </div>

      {message && (
        <p role="status" className="mb-4 text-sm text-accent">
          {message}
        </p>
      )}

      {proofs.length === 0 ? (
        <div className="card">
          <p className="font-semibold">Keine offenen Nachweise</p>
          <p className="mt-1 text-sm text-muted">
            Neue Fotos erscheinen hier, sobald Mitglieder
            ihre Missionen einreichen.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {proofs.map((proof) => (
            <article key={proof.id} className="card space-y-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {proof.title}
                </h2>
                <p className="text-sm text-muted">
                  {proof.xp} XP ·{" "}
                  {new Date(proof.created_at).toLocaleString("de-DE")}
                </p>
                <p className="mt-1 break-all text-xs text-muted">
                  Mitglied: {proof.user_id}
                </p>
              </div>

              {proof.image_url ? (
                <a
                  href={proof.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Nachweis vergrößern"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proof.image_url}
                    alt={`Nachweis für ${proof.title}`}
                    className="max-h-80 w-full rounded-xl object-contain"
                  />
                </a>
              ) : (
                <p className="text-red-400">
                  Foto konnte nicht geladen werden.
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  className="btn-primary flex items-center justify-center gap-2"
                  disabled={Boolean(busy)}
                  onClick={() => void review(proof, true)}
                >
                  <Check className="h-4 w-4" />
                  Genehmigen
                </button>

                <button
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-500/50 p-3 font-semibold text-red-400"
                  disabled={Boolean(busy)}
                  onClick={() => void review(proof, false)}
                >
                  <X className="h-4 w-4" />
                  Ablehnen
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
