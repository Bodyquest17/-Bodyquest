"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memberNav } from "@/lib/nav";

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-bg/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {memberNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? "text-accent" : "text-muted"}`}>
                <Icon className="h-6 w-6" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
