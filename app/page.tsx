import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-between px-6 pb-10 pt-[max(3rem,env(safe-area-inset-top))]">
      <div>
        <Logo size="lg" />
        <p className="mt-3 font-display text-2xl font-semibold tracking-wide text-muted">LEVEL UP YOUR BODY</p>
      </div>
      <div>
        <h1 className="font-display text-5xl font-extrabold leading-[0.95]">
          Tägliche Quests.<br />Echte Gewohnheiten.
        </h1>
        <p className="mt-4 text-lg text-muted">
          Sammle XP für Training, Ernährung, Regeneration und Disziplin – kostenlos und in deinem Tempo.
        </p>
        <div className="mt-8 grid gap-3">
          <Link href="/registrieren" className="btn-primary">Kostenlos starten</Link>
          <Link href="/login" className="btn-ghost">Ich habe schon ein Konto</Link>
        </div>
      </div>
    </main>
  );
}
