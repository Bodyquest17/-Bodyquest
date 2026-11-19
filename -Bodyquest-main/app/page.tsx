"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getSupabase } from "@/lib/supabase";
import { SLOGAN } from "@/lib/goals";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard"); else setChecking(false);
    }).catch(() => setChecking(false));
  }, [router]);

  if (checking) return <main className="grid min-h-dvh place-items-center text-muted">BODY QUEST wird geladen...</main>;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-6 text-center">
      <Logo size="lg" />
      <h1 className="font-display text-3xl font-bold leading-tight text-accent">{SLOGAN}</h1>
      <p className="text-muted">Tägliche Missionen, die zu deinem Ziel passen. Sammle XP, steige im Level auf und verfolge deinen Fortschritt.</p>
      <div className="grid gap-3">
        <Link href="/registrieren" className="btn-primary">Jetzt starten</Link>
        <Link href="/login" className="btn-ghost">Anmelden</Link>
      </div>
    </main>
  );
}
