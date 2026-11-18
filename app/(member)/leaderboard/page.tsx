
"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Users } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type Player = {
  username: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
};

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLeaderboard() {
      const { data, error } = await getSupabase().rpc(
        "get_bodyquest_leaderboard"
      );

      if (error) {
        setError(error.message);
      } else {
        setPlayers((data ?? []) as Player[]);
      }

      setLoading(false);
    }

    void loadLeaderboard();
  }, []);

  return (
    <main className="grid gap-5">
      <header className="grid gap-2">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-400" />
          <h1 className="text-3xl font-bold">Rangliste</h1>
        </div>
        <p className="text-muted">
          Trainiere, erfülle Missionen und sammle XP.
          Jede Mission bringt dich deinem Ziel näher!
        </p>
      </header>

      <section className="card grid gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-semibold">
            BodyQuest Top 100
          </h2>
        </div>

        {loading && <p>Lade Rangliste...</p>}

        {error && (
          <p role="alert" className="text-red-400">
            Fehler: {error}
          </p>
        )}

        {!loading && !error && players.length === 0 && (
          <p className="text-muted">
            Noch keine Mitglieder in der Rangliste.
            Aktiviere die Teilnahme in deinem Profil.
          </p>
        )}

        {!loading && !error && players.length > 0 && (
          <div className="grid gap-3">
            {players.map((player, index) => (
              <div
                key={`${player.username}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 p-3"
              >
                <div className="flex w-10 shrink-0 items-center justify-center">
                  {index === 0 ? (
                    <Medal className="h-7 w-7 text-yellow-400" />
                  ) : index === 1 ? (
                    <Medal className="h-7 w-7 text-gray-300" />
                  ) : index === 2 ? (
                    <Medal className="h-7 w-7 text-amber-600" />
                  ) : (
                    <span className="font-bold text-muted">
                      #{index + 1}
                    </span>
                  )}
                </div>

                {player.avatar_url ? (
                  <img
                    src={player.avatar_url}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                    <Users className="h-5 w-5" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {player.username}
                  </p>
                  <p className="text-sm text-muted">
                    Level {player.level}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-[#B7F34B]">
                    {player.total_xp.toLocaleString("de-DE")} XP
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
