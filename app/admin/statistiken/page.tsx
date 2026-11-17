import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Admin · Statistiken" };

export default function Page() {
  return (
    <>
      <PageHeader title="Statistiken" />
      <EmptyState icon={BarChart3} title="Noch nichts vorhanden" text="Auswertungen kommen in Phase 5." />
    </>
  );
}
