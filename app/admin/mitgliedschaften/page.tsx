import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Admin · Mitgliedschaften" };

export default function Page() {
  return (
    <>
      <PageHeader title="Mitgliedschaften" />
      <EmptyState icon={CreditCard} title="Noch nichts vorhanden" text="FREE, PRO und ELITE werden vorbereitet. Zahlungen folgen erst in Phase 7." />
    </>
  );
}
