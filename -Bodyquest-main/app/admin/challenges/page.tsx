import { Flag } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Admin · Challenges" };

export default function Page() {
  return (
    <>
      <PageHeader title="Challenges" />
      <EmptyState icon={Flag} title="Noch nichts vorhanden" text="Challenge-Verwaltung kommt in Phase 5." />
    </>
  );
}
