"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memberNav } from "@/lib/nav";

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-bg/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${memberNav.length}, minmax(0, 1fr))` }}>
        {memberNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 px-0.5 text-center text-[10px] font-medium ${active ? "text-accent" : "text-muted"}`}
              >
                <Icon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
