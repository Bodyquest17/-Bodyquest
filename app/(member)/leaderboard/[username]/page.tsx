"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Trophy, Users, Zap, Medal } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type Player = {
  username: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
};

export default function PublicPlayerProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [player, setPlayer] = useState<Player | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      setPlayer(null);
      setRank(null);
      const { data, error: requestError } = await getSupabase().rpc("get_bodyquest_leaderboard");
      if (!active) return;
      if (requestError) {
        setError(requestError.message);
      } else {
        const list = (data ?? []) as Player[];
        const index = list.findIndex((item) => item.username === username);
        if (index !== -1) {
          setPlayer(list[index]);
          setRank(index + 1);
        }
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [username]);

  return (
    <main className="grid gap-5">
      <Link href="/leaderboard" className="inline-flex w-fit items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Zur Rangliste
      </Link>
      {loading && <p className="text-muted">Lade öffentliches Profil...</p>}
      {error && <p role="alert" className="card text-red-400">Profil konnte nicht geladen werden: {error}</p>}
      {!loading && !error && !player && (
        <section className="card grid gap-2">
          <h1 className="text-2xl font-bold">Profil nicht gefunden</h1>
          <p className="text-muted">Dieses Mitglied ist derzeit nicht in der öffentlichen Top-100-Rangliste sichtbar.</p>
        </section>
      )}
      {!loading && !error && player && (
        <>
          <section className="card grid justify-items-center gap-4 text-center">
            {player.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.avatar_url} alt="" className="h-28 w-28 rounded-full border-2 border-[#B7F34B] object-cover" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#B7F34B] bg-white/10">
                <Users className="h-12 w-12 text-[#B7F34B]" />
              </div>
            )}
            <div className="grid gap-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#B7F34B]">BodyQuest Athlet</p>
              <h1 className="break-all text-3xl font-bold">{player.username}</h1>
              <p className="text-sm text-muted">Öffentliches Community-Profil</p>
            </div>
          </section>
          <div className="grid grid-cols-3 gap-3">
            <section className="card grid justify-items-center gap-2 p-3 text-center">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <p className="text-xl font-bold">#{rank}</p>
              <p className="text-xs text-muted">Rang</p>
            </section>
            <section className="card grid justify-items-center gap-2 p-3 text-center">
              <Medal className="h-6 w-6 text-[#B7F34B]" />
              <p className="text-xl font-bold">{player.level}</p>
              <p className="text-xs text-muted">Level</p>
            </section>
            <section className="card grid justify-items-center gap-2 p-3 text-center">
              <Zap className="h-6 w-6 text-[#B7F34B]" />
              <p className="text-xl font-bold">{player.total_xp.toLocaleString("de-DE")}</p>
              <p className="text-xs text-muted">Gesamt-XP</p>
            </section>
          </div>
          <p className="text-center text-xs text-muted">Private Körperdaten, Ziele und Nachweisfotos werden hier nicht angezeigt.</p>
        </>
      )}
    </main>
  );
}
