
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type User } from "@supabase/supabase-js";
import { Logo } from "@/components/Logo";

const missions = [
  { id: 1, title: "30 Minuten Training", xp: 100, icon: "💪" },
  { id: 2, title: "10.000 Schritte", xp: 75, icon: "🚶" },
  { id: 3, title: "2 Liter Wasser trinken", xp: 50, icon: "💧" },
  { id: 4, title: "Gesunde Mahlzeit essen", xp: 50, icon: "🥗" },
  { id: 5, title: "8 Stunden Schlaf anstreben", xp: 75, icon: "😴" },
];

type Completion = {
  id: string;
  quest_id: number;
  completed_date: string;
};

function todayBerlin() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

export default function Home() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    return url && key ? createClient(url, key) : null;
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [today, setToday] = useState(todayBerlin());

  useEffect(() => {
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      const { data, error: authError } =
        await supabase!.auth.getUser();

      if (!active) return;

      if (authError && authError.name !== "AuthSessionMissingError") {
        setError("Anmeldung konnte nicht überprüft werden.");
        setLoading(false);
        return;
      }

      const currentUser = data.user;
      setUser(currentUser);

      if (currentUser) {
        const { data: rows, error: dbError } = await supabase!
          .from("quest_completions")
          .select("id, quest_id, completed_date")
          .eq("user_id", currentUser.id);

        if (!active) return;

        if (dbError) {
          setError("Fortschritt konnte nicht geladen werden: " + dbError.message);
        } else {
          setCompletions(rows ?? []);
        }
      }

      if (active) setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [supabase]);

  const completedToday = completions
    .filter((row) => row.completed_date === today)
    .map((row) => row.quest_id);

  const xp = completions.reduce((total, row) => {
    const mission = missions.find((m) => m.id === row.quest_id);
    return total + (mission?.xp ?? 0);
  }, 0);

  const level = Math.floor(xp / 500) + 1;
  const progress = ((xp % 500) / 500) * 100;

  async function toggleMission(id: number) {
    if (!supabase || !user || saving !== null) return;

    setSaving(id);
    setError("");

    const date = todayBerlin();
    setToday(date);

    const existing = completions.find(
      (row) => row.quest_id === id && row.completed_date === date
    );

    if (existing) {
      const { error: dbError } = await supabase
        .from("quest_completions")
        .delete()
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (dbError) {
        setError(dbError.message);
      } else {
        setCompletions((previous) =>
          previous.filter((row) => row.id !== existing.id)
        );
      }
    } else {
      const { data, error: dbError } = await supabase
        .from("quest_completions")
        .insert({
          user_id: user.id,
          quest_id: id,
          completed_date: date,
        })
        .select("id, quest_id, completed_date")
        .single();

      if (dbError) {
        setError(dbError.message);
      } else if (data) {
        setCompletions((previous) => [...previous, data]);
      }
    }

    setSaving(null);
  }

  async function logout() {
    if (!supabase) return;

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    setUser(null);
    setCompletions([]);
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p>BODYQUEST wird geladen...</p>
      </main>
    );
  }

  if (!user && !error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-between px-6 pb-10 pt-12">
        <div>
          <Logo size="lg" />
          <p className="mt-3 font-display text-2xl font-semibold text-muted">
            LEVEL UP YOUR BODY
          </p>
        </div>

        <div>
          <h1 className="font-display text-5xl font-extrabold leading-tight">
            Tägliche Quests.
            <br />
            Echte Gewohnheiten.
          </h1>

          <p className="mt-4 text-lg text-muted">
            Sammle XP für Training, Ernährung, Regeneration und Disziplin.
          </p>

          <div className="mt-8 grid gap-3">
            <Link href="/registrieren" className="btn-primary">
              Kostenlos starten
            </Link>
            <Link href="/login" className="btn-ghost">
              Ich habe schon ein Konto
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-zinc-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">
              BODY<span className="text-lime-400">QUEST</span>
            </h1>
            <p className="text-sm text-zinc-400">
              LEVEL UP YOUR BODY
            </p>
          </div>

          {user && (
            <button
              onClick={logout}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm"
            >
              Abmelden
            </button>
          )}
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-500 p-4 text-red-400"
          >
            {error}
            {!user && (
              <Link href="/login" className="mt-3 block underline">
                Zur Anmeldung
              </Link>
            )}
          </div>
        )}

        {user && (
          <>
            <section className="mt-10">
              <p className="text-zinc-400">Willkommen zurück!</p>
              <h2 className="mt-2 break-all text-xl font-bold">
                {user.email}
              </h2>
              <p className="mt-3 text-zinc-300">
                Jede Mission bringt dich deinem Ziel näher.
              </p>
            </section>

            <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Dein Level</p>
                  <p className="text-4xl font-black text-lime-400">
                    {level}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-zinc-400">Gesammelte XP</p>
                  <p className="text-2xl font-bold">{xp} XP</p>
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-zinc-700">
                <div
                  className="h-full rounded-full bg-lime-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-2 text-sm text-zinc-400">
                {500 - (xp % 500)} XP bis zum nächsten Level
              </p>
            </section>

            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Heutige Missionen
                </h2>
                <span className="text-sm text-lime-400">
                  {completedToday.length}/{missions.length}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {missions.map((mission) => {
                  const done = completedToday.includes(mission.id);

                  return (
                    <button
                      key={mission.id}
                      onClick={() => toggleMission(mission.id)}
                      disabled={saving !== null}
                      aria-pressed={done}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
                        done
                          ? "border-lime-400 bg-lime-400/10"
                          : "border-zinc-800 bg-zinc-900"
                      }`}
                    >
                      <span className="text-3xl">{mission.icon}</span>

                      <div className="flex-1">
                        <p className="font-semibold">{mission.title}</p>
                        <p className="text-sm text-lime-400">
                          +{mission.xp} XP
                        </p>
                      </div>

                      <span className="text-2xl">
                        {saving === mission.id
                          ? "⏳"
                          : done
                          ? "✅"
                          : "○"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <p className="mt-8 text-center text-sm text-zinc-400">
              Deine Missionen und XP werden in Supabase gespeichert.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
