import { Settings } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Admin · Einstellungen" };

export default function Page() {
  return (
    <>
      <PageHeader title="Einstellungen" />
      <EmptyState icon={Settings} title="Noch nichts vorhanden" text="XP-Werte und Zeitzone (Europe/Berlin) kommen in Phase 3." />
    </>
  );
}
