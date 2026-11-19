"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getSupabase } from "@/lib/supabase";
import { SLOGAN } from "@/lib/goals";

export default function ConfirmedPage() {
  const [state, setState] = useState<"checking" | "ok" | "error">("checking");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    if (hash.get("error") || query.get("error")) { setState("error"); return; }
    getSupabase().auth.getSession()
      .then(({ data }) => { setSignedIn(!!data.session); setState("ok"); })
      .catch(() => setState("ok"));
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo size="lg" />
      {state === "checking" && <p className="text-muted">Einen Moment...</p>}

      {state === "ok" && (
        <>
          <CheckCircle2 className="h-16 w-16 text-accent" aria-hidden />
          <h1 className="font-display text-4xl font-bold leading-tight">Bestätigung erfolgreich!</h1>
          <p className="text-muted">Willkommen bei BODY QUEST. Viel Spaß und viel Erfolg auf deiner Reise!</p>
          <p className="text-sm font-semibold tracking-wide text-accent">{SLOGAN}</p>
          <Link href={signedIn ? "/dashboard" : "/login"} className="btn-primary w-full">
            {signedIn ? "Los geht's" : "Jetzt anmelden"}
          </Link>
        </>
      )}

      {state === "error" && (
        <>
          <TriangleAlert className="h-16 w-16 text-accent" aria-hidden />
          <h1 className="font-display text-3xl font-bold leading-tight">Der Link ist abgelaufen oder wurde schon benutzt</h1>
          <p className="text-muted">Versuche dich anzumelden. Falls das nicht klappt, registriere dich erneut, dann bekommst du eine neue E-Mail.</p>
          <Link href="/login" className="btn-primary w-full">Zur Anmeldung</Link>
        </>
      )}
    </main>
  );
}
