import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Fortschritt" };

export default function Page() {
  return (
    <>
      <PageHeader title="Fortschritt" subtitle="Level, XP, Streaks und Badges." />
      <EmptyState icon={TrendingUp} title="Noch kein Fortschritt" text="Schließe deine erste Quest ab, um XP zu sammeln." />
    </>
  );
}
