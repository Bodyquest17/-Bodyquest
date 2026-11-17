import { BottomNav } from "@/components/BottomNav";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
