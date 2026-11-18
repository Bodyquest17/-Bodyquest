"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Trophy, Users, Zap } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type Player = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
};

export default function PublicPlayerProfilePage() {
  const params = useParams();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const [player, setPlayer] = useState<Player | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const { data, error: requestError } = await getSupabase().rpc("get_bodyquest_leaderboard");
      if (!active) return;
      if (requestError) {
        setError(requestError.message);
      } else {
        const players = (data ?? []) as Player[];
        const index = players.findIndex((item) => item.user_id === userId);
        setPlayer(index >= 0 ? players[index] : null);
        setRank(index >= 0 ? index + 1 : null);
      }
      setLoading(false);
    }
    void loadProfile();
    return () => { active = false; };
  }, [userId]);

  return (
    <main className="grid gap-5">
      <Link href="/leaderboard" className="flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Zurück zur Rangliste
      </Link>
      {loading && <p className="text-muted">Profil wird geladen...</p>}
      {error && <p role="alert" className="text-red-400">Fehler: {error}</p>}
      {!loading && !error && !player && (
        <section className="card grid gap-2">
          <h1 className="text-2xl font-bold">Profil nicht verfügbar</h1>
          <p className="text-muted">Dieses Mitglied ist nicht in der aktuellen Top 100 oder hat die öffentliche Anzeige deaktiviert.</p>
        </section>
      )}
      {!loading && !error && player && (
        <section className="card grid gap-5">
          <div className="flex items-center gap-4">
            {player.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10"><Users className="h-9 w-9" /></div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Öffentliches Athletenprofil</p>
              <h1 className="truncate font-display text-3xl font-bold">{player.username}</h1>
              <p className="text-sm text-muted">Level {player.level}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm text-muted"><Zap className="h-4 w-4 text-accent" /> Gesamt-XP</div>
              <p className="mt-2 text-2xl font-bold text-accent">{player.total_xp.toLocaleString("de-DE")}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm text-muted"><Trophy className="h-4 w-4 text-yellow-400" /> Rangliste</div>
              <p className="mt-2 text-2xl font-bold">#{rank}</p>
            </div>
          </div>
          <p className="text-xs text-muted">Hier sind nur öffentliche Ranglistendaten sichtbar. Körperdaten und Missionsnachweise bleiben privat.</p>
        </section>
      )}
    </main>
  );
}
