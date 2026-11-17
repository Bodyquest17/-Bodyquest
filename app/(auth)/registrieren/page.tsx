import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PhaseNotice } from "@/components/PhaseNotice";

export const metadata = { title: "Registrieren" };

export default function RegisterPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-6 pt-[max(3rem,env(safe-area-inset-top))]">
      <Link href="/" aria-label="Zur Startseite"><Logo /></Link>
      <h1 className="mt-8 font-display text-4xl font-bold">Konto erstellen</h1>
      <PhaseNotice phase="Phase 2">Die Registrierung mit E-Mail-Bestätigung wird im nächsten Schritt aktiviert. Bis dahin ist das Formular gesperrt.</PhaseNotice>
      <form className="grid gap-4" aria-disabled>
        <label className="grid gap-1 text-sm text-muted">Anzeigename
          <input className="field" type="text" autoComplete="nickname" disabled />
        </label>
        <label className="grid gap-1 text-sm text-muted">E-Mail
          <input className="field" type="email" autoComplete="email" disabled />
        </label>
        <label className="grid gap-1 text-sm text-muted">Passwort (mind. 8 Zeichen)
          <input className="field" type="password" autoComplete="new-password" disabled />
        </label>
        <button className="btn-primary" type="submit" disabled>Registrieren</button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-accent underline">Schon registriert? Anmelden</Link>
      </p>
    </main>
  );
}
