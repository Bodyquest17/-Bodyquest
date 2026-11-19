import { Swords } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Admin · Quests" };

export default function Page() {
  return (
    <>
      <PageHeader title="Quests" />
      <EmptyState icon={Swords} title="Noch nichts vorhanden" text="Erstellen, bearbeiten, archivieren und veröffentlichen – kommt in Phase 3." />
    </>
  );
}
