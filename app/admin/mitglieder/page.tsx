import { Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Admin · Mitglieder" };

export default function Page() {
  return (
    <>
      <PageHeader title="Mitglieder" />
      <EmptyState icon={Users} title="Noch nichts vorhanden" text="Mitgliederliste und Fortschritt kommen in Phase 3 und 4." />
    </>
  );
}
