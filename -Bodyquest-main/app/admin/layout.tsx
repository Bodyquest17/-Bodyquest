import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Admin" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link href="/admin" aria-label="Admin-Übersicht"><Logo /></Link>
        <Link href="/dashboard" className="text-sm text-muted underline">Zur App</Link>
      </header>
      <AdminNav />
      <main className="px-4 py-6">
        {/* Phase 2: Zugriff nur für Rolle ADMIN (serverseitig + RLS). Bis dahin nur Vorschau. */}
        {children}
      </main>
    </div>
  );
}
