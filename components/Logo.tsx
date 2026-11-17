export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${size === "lg" ? "text-5xl" : "text-2xl"}`}>
      BODY <span className="text-accent">QUEST</span>
    </span>
  );
}
