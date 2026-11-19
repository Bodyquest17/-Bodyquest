"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, LogOut, TrendingUp, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getSupabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { GOALS, goalLabel, rankForLevel } from "@/lib/goals";

const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
const MAX_BYTES = 5 * 1024 * 1024;

export default function ProfilePage() {
  const router = useRouter();
  const { loading, user, profile, error, reload } = useProfile({ requireOnboarding: true });
  const [f, setF] = useState({ username: "", bio: "", age: "", height: "", level: "anfaenger", days: 3, diet: "", allergies: "", calories: "", protein: "" });
  const [isPublic, setIsPublic] = useState(false);
  const [ranking, setRanking] = useState(false);
  const [notif, setNotif] = useState({ daily_reminder: true, weekly_report: true });
  const [weight, setWeight] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setF({
      username: profile.username ?? "", bio: profile.bio ?? "", age: profile.age?.toString() ?? "",
      height: profile.height_cm?.toString() ?? "", level: profile.fitness_level ?? "anfaenger",
      days: profile.days_per_week ?? 3, diet: profile.diet_type ?? "", allergies: profile.allergies ?? "",
      calories: profile.calorie_target?.toString() ?? "", protein: profile.protein_target_g?.toString() ?? "",
    });
    setIsPublic(profile.is_public); setRanking(profile.show_in_leaderboard);
    setNotif({ daily_reminder: profile.notifications?.daily_reminder ?? true, weekly_report: profile.notifications?.weekly_report ?? true });
    setNewGoal(profile.goal_primary ?? "");
    setNewTarget(profile.target_weight_kg?.toString() ?? "");
  }, [profile]);

  async function loadPhotos(uid: string) {
    const sb = getSupabase();
    const l = await sb.storage.from("progress-photos").list(uid, { limit: 12, sortBy: { column: "created_at", order: "desc" } });
    const names = (l.data ?? []).map((o) => `${uid}/${o.name}`);
    if (!names.length) { setPhotos([]); return; }
    const s = await sb.storage.from("progress-photos").createSignedUrls(names, 3600);
    setPhotos((s.data ?? []).map((x) => x.signedUrl).filter(Boolean) as string[]);
  }
  useEffect(() => { if (user) void loadPhotos(user.id); }, [user]);

  async function save() {
    if (!user) return;
    setBusy(true); setMsg("");
    const { error: e } = await getSupabase().from("profiles").update({
      username: f.username.trim() || null, bio: f.bio.trim() || null,
      age: num(f.age), height_cm: num(f.height), fitness_level: f.level, days_per_week: f.days,
      diet_type: f.diet || null, allergies: f.allergies.trim() || null,
      calorie_target: num(f.calories), protein_target_g: num(f.protein),
      is_public: isPublic, show_in_leaderboard: ranking, notifications: notif,
    }).eq("id", user.id);
    setBusy(false);
    setMsg(e ? `Fehler: ${e.message}` : "Gespeichert.");
    if (!e) await reload();
  }

  async function upload(file: File, bucket: "avatars" | "progress-photos") {
    if (!user) return;
    if (!file.type.startsWith("image/")) { setMsg("Bitte ein Bild auswählen."); return; }
    if (file.size > MAX_BYTES) { setMsg("Das Bild ist größer als 5 MB."); return; }
    setBusy(true); setMsg("");
    const sb = getSupabase();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const up = await sb.storage.from(bucket).upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); setMsg(`Fehler: ${up.error.message}`); return; }
    if (bucket === "avatars") {
      const url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      await sb.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      await reload();
    } else {
      await loadPhotos(user.id);
    }
    setBusy(false); setMsg("Bild gespeichert.");
  }

  async function logWeight() {
    const w = num(weight);
    if (!w || w < 30 || w > 300) { setMsg("Bitte ein Gewicht zwischen 30 und 300 kg eingeben."); return; }
    setBusy(true); setMsg("");
    const { data, error: e } = await getSupabase().rpc("log_weight", { p_weight: w });
    setBusy(false);
    if (e) { setMsg(`Fehler: ${e.message}`); return; }
    setWeight(""); setMsg(data?.goal_reached ? "Gewicht gespeichert. Du hast dein Ziel erreicht! Schau aufs Dashboard." : "Gewicht gespeichert.");
    await reload();
  }

  async function changeGoal() {
    setBusy(true); setMsg("");
    const t = num(newTarget);
    const { error: e } = await getSupabase().rpc("change_goal", { p_goal: newGoal, p_target_weight: t });
    setBusy(false);
    setMsg(e ? `Fehler: ${e.message}` : "Ziel geändert. Deine Missionen passen sich an.");
    if (!e) await reload();
  }

  async function logout() { await getSupabase().auth.signOut(); router.replace("/login"); }

  if (loading) return <p className="text-muted">Wird geladen...</p>;
  if (error) return <p role="alert" className="text-red-400">{error}</p>;
  if (!profile) return null;

  const toggle = (on: boolean, set: (v: boolean) => void, label: string, hint?: string) => (
    <label className="flex items-center justify-between gap-4 py-2">
      <span>{label}{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
      <input type="checkbox" className="h-6 w-6 accent-[#B7F34B]" checked={on} onChange={(e) => set(e.target.checked)} />
    </label>
  );

  return (
    <div className="grid gap-4">
      <PageHeader title="Mein Profil" subtitle="Deine Daten sind standardmäßig privat." />

      <Link href="/fortschritt" className="card flex items-center gap-3 transition-colors hover:border-accent/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label="Meinen Fortschritt öffnen">
        <span className="rounded-xl bg-accent/10 p-3 text-accent"><TrendingUp className="h-6 w-6" aria-hidden /></span>
        <span className="min-w-0 flex-1"><span className="block font-display text-lg font-bold">Mein Fortschritt</span><span className="block text-sm text-muted">XP, Level und deine Entwicklung ansehen</span></span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden />
      </Link>

      <section className="card flex items-center gap-4">
        <label className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full bg-bg" aria-label="Profilbild ändern">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {profile.avatar_url ? <img src={profile.avatar_url} alt="Profilbild" className="h-full w-full object-cover" />
            : <Camera className="absolute inset-0 m-auto h-8 w-8 text-muted" aria-hidden />}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "avatars")} />
        </label>
        <div>
          <p className="font-display text-2xl font-bold">{profile.username ?? "Athlet"}</p>
          <p className="text-sm text-muted">Level {profile.level} · {rankForLevel(profile.level)} · {profile.total_xp} XP</p>
          <p className="text-sm text-muted">Ziel: {goalLabel(profile.goal_primary)}</p>
        </div>
      </section>

      <section className="card grid gap-3">
        <h2 className="font-display text-2xl font-semibold">Über mich</h2>
        <label className="grid gap-1 text-sm text-muted">Benutzername<input className="field" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></label>
        <label className="grid gap-1 text-sm text-muted">Beschreibung<textarea className="field min-h-24 py-3" maxLength={300} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm text-muted">Alter<input className="field" inputMode="numeric" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></label>
          <label className="grid gap-1 text-sm text-muted">Größe (cm)<input className="field" inputMode="numeric" value={f.height} onChange={(e) => setF({ ...f, height: e.target.value })} /></label>
        </div>
        <label className="grid gap-1 text-sm text-muted">Trainingsniveau
          <select className="field" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>
            <option value="anfaenger">Anfänger</option><option value="fortgeschritten">Fortgeschritten</option><option value="profi">Profi</option>
          </select></label>
        <label className="grid gap-1 text-sm text-muted">Trainingstage pro Woche: {f.days}
          <input type="range" min={1} max={7} value={f.days} onChange={(e) => setF({ ...f, days: Number(e.target.value) })} /></label>
      </section>

      <section className="card grid gap-3">
        <h2 className="font-display text-2xl font-semibold">Ernährung</h2>
        <label className="grid gap-1 text-sm text-muted">Ernährungsweise
          <select className="field" value={f.diet} onChange={(e) => setF({ ...f, diet: e.target.value })}>
            <option value="">Keine Angabe</option><option value="alles">Alles</option><option value="vegetarisch">Vegetarisch</option>
            <option value="vegan">Vegan</option><option value="pescetarisch">Pescetarisch</option><option value="low_carb">Low Carb</option>
          </select></label>
        <label className="grid gap-1 text-sm text-muted">Allergien<input className="field" value={f.allergies} onChange={(e) => setF({ ...f, allergies: e.target.value })} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm text-muted">Kalorienziel<input className="field" inputMode="numeric" value={f.calories} onChange={(e) => setF({ ...f, calories: e.target.value })} /></label>
          <label className="grid gap-1 text-sm text-muted">Protein (g)<input className="field" inputMode="numeric" value={f.protein} onChange={(e) => setF({ ...f, protein: e.target.value })} /></label>
        </div>
      </section>

      <section className="card">
        <h2 className="font-display text-2xl font-semibold">Privatsphäre & Benachrichtigungen</h2>
        {toggle(isPublic, setIsPublic, "Profil öffentlich", "Nur Name, Bild, Beschreibung und Level. Körperdaten bleiben privat.")}
        {toggle(ranking, setRanking, "In der Rangliste erscheinen")}
        {toggle(notif.daily_reminder, (v) => setNotif({ ...notif, daily_reminder: v }), "Tägliche Erinnerung")}
        {toggle(notif.weekly_report, (v) => setNotif({ ...notif, weekly_report: v }), "Wochenbericht")}
      </section>

      <button className="btn-primary" disabled={busy} onClick={save}>Änderungen speichern</button>
      {msg && <p role="status" className="text-center text-sm text-muted">{msg}</p>}

      <section className="card grid gap-3">
        <h2 className="font-display text-2xl font-semibold">Gewicht</h2>
        <p className="text-sm text-muted">Aktuell: {profile.weight_kg ?? "–"} kg · Wunsch: {profile.target_weight_kg ?? "–"} kg</p>
        <div className="flex gap-3">
          <input className="field" inputMode="decimal" placeholder="Neues Gewicht (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} aria-label="Neues Gewicht in Kilogramm" />
          <button className="btn-ghost" disabled={busy} onClick={logWeight}>Eintragen</button>
        </div>
      </section>

      <section className="card grid gap-3">
        <h2 className="font-display text-2xl font-semibold">Ziel ändern</h2>
        <select className="field" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} aria-label="Hauptziel">
          {GOALS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
        </select>
        <input className="field" inputMode="decimal" placeholder="Wunschgewicht (kg, optional)" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} aria-label="Wunschgewicht" />
        <button className="btn-ghost" disabled={busy || !newGoal} onClick={changeGoal}>Ziel übernehmen</button>
      </section>

      <section className="card grid gap-3">
        <h2 className="font-display text-2xl font-semibold">Fortschrittsbilder (privat)</h2>
        <label className="btn-ghost cursor-pointer">
          <Camera className="h-5 w-5" aria-hidden /> Bild hinzufügen
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "progress-photos")} />
        </label>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((u) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={u} src={u} alt="Fortschrittsbild" className="aspect-square rounded-lg object-cover" />)}
          </div>
        )}
      </section>

      <button className="btn-ghost" onClick={logout}><LogOut className="h-5 w-5" aria-hidden /> Abmelden</button>
    </div>
  );
}
