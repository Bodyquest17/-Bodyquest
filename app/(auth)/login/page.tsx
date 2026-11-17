
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error("Supabase ist nicht richtig konfiguriert.");
      }

      const supabase = createClient(url, key);

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Die Anmeldung ist fehlgeschlagen."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-3">
          BODYQUEST
        </h1>

        <p className="text-center text-gray-400 mb-10">
          Deine Mission beginnt hier.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block mb-2">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-2">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dein Passwort"
              className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
            />
          </div>

          {error && (
            <p role="alert" className="text-red-400 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold p-4 rounded-xl disabled:opacity-50"
          >
            {loading ? "Anmeldung läuft..." : "ANMELDEN"}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-8">
          Noch kein Konto?{" "}
          <Link href="/registrieren" className="text-white underline">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </main>
  );
}
