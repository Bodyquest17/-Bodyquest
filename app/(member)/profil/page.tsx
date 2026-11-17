import { User } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Profil" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profil" subtitle="Dein Konto und deine Privatsphäre." />
      <EmptyState icon={User} title="Nicht angemeldet" text="Profil, Ranking-Teilnahme, Datenexport und Kontolöschung folgen mit der Anmeldung in Phase 2 und 4." />
    </>
  );
}
