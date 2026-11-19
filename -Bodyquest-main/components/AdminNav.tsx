"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNav } from "@/lib/nav";

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin-Navigation" className="overflow-x-auto border-b border-white/10">
      <ul className="flex min-w-max gap-1 px-3">
        {adminNav.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined}
                className={`flex min-h-[48px] items-center gap-2 border-b-2 px-3 text-sm font-medium ${active ? "border-accent text-accent" : "border-transparent text-muted"}`}>
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
