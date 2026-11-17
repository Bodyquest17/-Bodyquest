
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Logo } from "@/components/Logo";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Bitte gib deinen Namen ein.");
      return;
    }

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      setError("Die Supabase-Verbindung ist nicht konfiguriert.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient(url, key);

      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) throw authError;

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registrierung fehlgeschlagen. Bitte versuche es erneut."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-6 pt-[max(3rem,env(safe-area-inset-top))]">
      <Link href="/" aria-label="Zur Startseite">
        <Logo />
      </Link>

      <h1 className="mt-8 font-display text-4xl font-bold">
        Konto erstellen
      </h1>

      {success ? (
        <div className="mt-8 grid gap-4">
          <h2 className="text-xl font-bold">
            Registrierung eingegangen!
          </h2>
          <p>
            Falls eine E-Mail-Bestätigung erforderlich ist,
            erhältst du eine Nachricht mit einem Bestätigungslink.
            Prüfe auch deinen Spam-Ordner.
          </p>
          <Link href="/login" className="btn-primary text-center">
            Zur Anmeldung
          </Link>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="mt-8 grid gap-4">
          <label className="grid gap-1 text-sm text-muted">
            Anzeigename
            <input
              className="field"
              type="text"
              autoComplete="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="grid gap-1 text-sm text-muted">
            E-Mail
            <input
              className="field"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="grid gap-1 text-sm text-muted">
            Passwort (mindestens 8 Zeichen)
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>

          <label className="grid gap-1 text-sm text-muted">
            Passwort wiederholen
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Wird registriert..." : "Registrieren"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-accent underline">
          Schon registriert? Anmelden
        </Link>
      </p>
    </main>
  );
}
