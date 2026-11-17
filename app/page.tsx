
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

export default function Home() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setLoading(false);
      return;
    }

    let active = true;

    async function checkUser() {
      const { data, error } = await supabase!.auth.getUser();

      if (!active) return;

      if (error && error.name !== "AuthSessionMissingError") {
        setError("Die Anmeldung konnte nicht überprüft werden.");
      }

      setUser(data.user);
      setLoading(false);
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const xp = missions
    .filter((mission) => completed.includes(mission.id))
    .reduce((sum, mission) => sum + mission.xp, 0);

  const level = Math.floor(xp / 500) + 1;
  const progress = ((xp % 500) / 500) * 100;

  function toggleMission(id: number) {
    setCompleted((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  async function logout() {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      setError("Abmelden fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }

    setUser(null);
    setCompleted([]);
  }

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-black text-white">
        <p>BODYQUEST wird geladen...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-black px-6 text-white">
        <h1 className="text-2xl font-bold">BODYQUEST</h1>
        <p role="alert" className="text-red-400">{error}</p>
        <Link href="/login" className="underline">
          Zur Anmeldung
        </Link>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-between px-6 pb-10 pt-[max(3rem,env(safe-area-inset-top))]">
        <div>
          <Logo size="lg" />
          <p className="mt-3 font-display text-2xl font-semibold tracking-wide text-muted">
            LEVEL UP YOUR BODY
          </p>
        </div>

        <div>
          <h1 className="font-display text-5xl font-extrabold leading-[0.95]">
            Tägliche Quests.
            <br />
            Echte Gewohnheiten.
          </h1>

          <p className="mt-4 text-lg text-muted">
            Sammle XP für Training, Ernährung, Regeneration
            und Disziplin – kostenlos und in deinem Tempo.
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
            <h1 className="text-2xl font-black tracking-tight">
              BODY<span className="text-lime-400">QUEST</span>
            </h1>
            <p className="text-sm text-zinc-400">
              Dein persönliches Dashboard
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm"
          >
            Abmelden
          </button>
        </header>

        <section className="mt-10">
          <p className="text-zinc-400">Willkommen zurück!</p>
          <h2 className="mt-2 break-all text-xl font-bold">
            {user.email}
          </h2>
          <p className="mt-3 text-zinc-300">
            Jede abgeschlossene Mission bringt dich weiter.
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
              <p className="text-sm text-zinc-400">Erfahrung</p>
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
              Deine Missionen
            </h2>
            <span className="text-sm text-lime-400">
              {completed.length}/{missions.length}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {missions.map((mission) => {
              const done = completed.includes(mission.id);

              return (
                <button
                  key={mission.id}
                  onClick={() => toggleMission(mission.id)}
                  aria-pressed={done}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    done
                      ? "border-lime-400 bg-lime-400/10"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <span className="text-3xl">
                    {mission.icon}
                  </span>

                  <div className="flex-1">
                    <p className="font-semibold">
                      {mission.title}
                    </p>
                    <p className="text-sm text-lime-400">
                      +{mission.xp} XP
                    </p>
                  </div>

                  <span className="text-2xl">
                    {done ? "✅" : "○"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Vorschau: Missionen und XP werden noch nicht
          dauerhaft gespeichert.
        </p>

        <footer className="mt-6 text-center text-sm text-zinc-500">
          BODYQUEST — LEVEL UP YOUR BODY
        </footer>
      </div>
    </main>
  );
}
