import { PageHeader } from "@/components/PageHeader";
import { PhaseNotice } from "@/components/PhaseNotice";

const stats = ["Mitglieder gesamt", "Aktive Mitglieder", "Abgeschlossene Quests", "Ø Teilnahme", "Aktive Challenges"];

export default function AdminHome() {
  return (
    <>
      <PageHeader title="Übersicht" />
      <PhaseNotice phase="Vorschau">Der Adminbereich wird in Phase 2 durch Anmeldung und Rollenprüfung geschützt. Kennzahlen stammen ab Phase 3 aus der Datenbank.</PhaseNotice>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <li key={s} className="card">
            <p className="font-display text-4xl font-bold text-accent">–</p>
            <p className="text-sm text-muted">{s}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
