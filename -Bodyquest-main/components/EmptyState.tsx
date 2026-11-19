import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 py-8 text-center">
      <Icon className="h-9 w-9 text-accent" aria-hidden />
      <p className="font-display text-xl font-semibold">{title}</p>
      <p className="max-w-xs text-sm text-muted">{text}</p>
    </div>
  );
}
