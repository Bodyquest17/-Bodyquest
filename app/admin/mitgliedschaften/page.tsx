import { PageHeader } from "@/components/PageHeader";
import PremiumCodeGenerator from "./PremiumCodeGenerator";

export const metadata = { title: "Admin · Mitgliedschaften" };

export default function Page() {
  return (
    <>
      <PageHeader title="Mitgliedschaften" />
      <PremiumCodeGenerator />
    </>
  );
}
