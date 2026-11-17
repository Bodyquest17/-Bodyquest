import { Swords } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Quests" };

export default function Page() {
  return (
    <>
      <PageHeader title="Quests" subtitle="Deine Aufgaben für heute und diese Woche." />
      <EmptyState icon={Swords} title="Noch keine Quests" text="Quests werden ab Phase 3 vom Admin veröffentlicht und erscheinen dann hier." />
    </>
  );
}
