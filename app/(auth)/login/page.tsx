import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PhaseNotice } from "@/components/PhaseNotice";

export const metadata = { title: "Anmelden" };

export default function LoginPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-6 pt-[max(3rem,env(safe-area-inset-top))]">
      <Link href="/" aria-label="Zur Startseite"><Logo /></Link>
      <h1 className="mt-8 font-display text-4xl font-bold">Anmelden</h1>
      <PhaseNotice phase="Phase 2">Die echte Anmeldung mit Supabase wird im nächsten Schritt aktiviert. Bis dahin ist das Formular gesperrt.</PhaseNotice>
      <form className="grid gap-4" aria-disabled>
        <label className="grid gap-1 text-sm text-muted">E-Mail
          <input className="field" type="email" autoComplete="email" disabled />
        </label>
        <label className="grid gap-1 text-sm text-muted">Passwort
          <input className="field" type="password" autoComplete="current-password" disabled />
        </label>
        <button className="btn-primary" type="submit" disabled>Anmelden</button>
      </form>
      <div className="mt-6 grid gap-3 text-center text-sm">
        <Link href="/registrieren" className="text-accent underline">Noch kein Konto? Registrieren</Link>
        <Link href="/dashboard" className="text-muted underline">Oberfläche ansehen (Vorschau)</Link>
      </div>
    </main>
  );
}
