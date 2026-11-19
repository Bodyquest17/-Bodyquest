"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  start_weight_kg: number | null;
  target_weight_kg: number | null;
  sex: "m" | "w" | "d" | null;
  fitness_level: string | null;
  goal_primary: string | null;
  goals_secondary: string[];
  days_per_week: number | null;
  minutes_per_session: number | null;
  training_location: string | null;
  limitations: string | null;
  diet_type: string | null;
  allergies: string | null;
  calorie_target: number | null;
  protein_target_g: number | null;
  total_xp: number;
  level: number;
  streak: number;
  onboarding_done: boolean;
  is_public: boolean;
  show_in_leaderboard: boolean;
  notifications: { daily_reminder?: boolean; weekly_report?: boolean };
};

export function useProfile(opts: { requireOnboarding?: boolean } = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const sb = getSupabase();
      const { data: s } = await sb.auth.getSession();
      const u = s.session?.user ?? null;
      if (!u) { router.replace("/login"); return; }
      setUser(u);

      let { data: p, error: e } = await sb.from("profiles").select("*").eq("id", u.id).maybeSingle();
      if (e) throw e;
      if (!p) {  // Konten von vor dem Trigger: Profil nachträglich anlegen
        const ins = await sb.from("profiles").insert({ id: u.id });
        if (ins.error) throw ins.error;
        ({ data: p } = await sb.from("profiles").select("*").eq("id", u.id).maybeSingle());
      }
      if (!p) throw new Error("Profil konnte nicht geladen werden.");
      setProfile(p as Profile);
      if (opts.requireOnboarding && !p.onboarding_done) { router.replace("/onboarding"); return; }
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Laden fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }, [router, opts.requireOnboarding]);

  useEffect(() => { void load(); }, [load]);
  return { loading, user, profile, error, reload: load };
}
