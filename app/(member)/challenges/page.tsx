import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Challenges" };

export default function Page() {
  return (
    <>
      <PageHeader title="Challenges" subtitle="7, 14 oder 30 Tage – bleib dran." />
      <EmptyState icon={Trophy} title="Noch keine Challenges" text="Challenges folgen in Phase 5." />
    </>
  );
}
