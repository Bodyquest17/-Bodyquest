import { Info } from "lucide-react";

export function PhaseNotice({ phase, children }: { phase: string; children: React.ReactNode }) {
  return (
    <p className="mb-4 flex gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm text-muted" role="note">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
      <span><strong className="text-white">{phase}:</strong> {children}</span>
    </p>
  );
}
