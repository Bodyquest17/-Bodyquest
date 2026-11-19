"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { CheckCircle2, Copy, KeyRound, Search, ShieldCheck } from "lucide-react";

type Plan = 30 | 90 | 180 | 365;
type Member = { user_id: string; username: string | null; member_level: number; total_xp: number };
type CreatedCode = {
  code: string;
  payment_id: string;
  code_id: string;
  amount_cents: number;
  duration_days: number;
  code_expires_at: string | null;
};

const PLANS: { days: Plan; label: string; price: string }[] = [
  { days: 30, label: "30 Tage", price: "7,99 €" },
  { days: 90, label: "90 Tage", price: "19,99 €" },
  { days: 180, label: "180 Tage · Admin-Sonderlaufzeit", price: "34,99 €" },
  { days: 365, label: "365 Tage", price: "59,99 €" },
];

export default function PremiumCodeGenerator() {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [duration, setDuration] = useState<Plan>(90);
  const [note, setNote] = useState("");
  const [cashReceived, setCashReceived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedCode | null>(null);
  const [copied, setCopied] = useState(false);
  const plan = PLANS.find((p) => p.days === duration)!;

  useEffect(() => {
    if (created) return;
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const { data, error: rpcError } = await getSupabase().rpc("bq_admin_search_members", {
          p_search: query.trim(),
        });
        if (rpcError) throw new Error(rpcError.message);
        if (active) setMembers((data ?? []) as Member[]);
      } catch (e) {
        if (active) {
          setMembers([]);
          setSearchError(e instanceof Error ? e.message : "Mitglieder konnten nicht geladen werden.");
        }
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [query, created]);

  async function generate() {
    if (loading || created) return;
    setError("");
    if (!selected) { setError("Bitte zuerst ein Mitglied auswählen."); return; }
    if (!cashReceived) { setError("Bitte den tatsächlichen Eingang der Barzahlung bestätigen."); return; }
    setLoading(true);
    try {
      const sb = getSupabase();
      const { data: authData, error: authError } = await sb.auth.getUser();
      if (authError || !authData.user) throw new Error("Bitte melde dich als Admin an.");
      const { data, error: rpcError } = await sb.rpc("bq_create_premium_code", {
        p_user_id: selected.user_id,
        p_duration_days: duration,
        p_note: note.trim() || null,
      });
      if (rpcError) throw new Error(rpcError.message);
      const result = (Array.isArray(data) ? data[0] : data) as CreatedCode | undefined;
      if (!result?.code) throw new Error("Kein Code zurückgegeben. Bitte zuerst die Zahlungshistorie prüfen, bevor du erneut klickst.");
      setCreated(result);
      setCashReceived(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.code);
      setCopied(true);
    } catch {
      setError("Kopieren nicht möglich. Bitte den Code manuell markieren.");
    }
  }

  function reset() {
    setCreated(null);
    setSelected(null);
    setQuery("");
    setDuration(90);
    setNote("");
    setCashReceived(false);
    setCopied(false);
    setError("");
  }

  return (
    <section className="mx-auto mt-6 max-w-2xl space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-bold">Premiumcode erstellen</h2>
          <p className="text-sm text-zinc-500">Mitglied suchen · Zahlung bestätigen · Code ausgeben</p>
        </div>
      </div>

      {created ? (
        <div className="space-y-4" role="status">
          <div className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" /> Code erstellt und Barzahlung dokumentiert
          </div>
          <p className="text-sm">Für: <strong>{selected?.username || "Mitglied"}</strong> · ID {selected?.user_id}</p>
          <p className="text-sm">Diesen Code sicher an das ausgewählte Mitglied übergeben. Er wird nur einmal angezeigt.</p>
          <div className="break-all rounded-lg border border-zinc-300 bg-zinc-50 p-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900" aria-label="Premiumcode">{created.code}</div>
          <button type="button" onClick={copyCode} className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
            <Copy className="h-4 w-4" /> {copied ? "Kopiert" : "Code kopieren"}
          </button>
          <p className="text-sm text-zinc-500">Laufzeit: {created.duration_days} Tage ab Einlösung. {created.code_expires_at ? `Code gültig bis: ${new Date(created.code_expires_at).toLocaleString("de-DE")}.` : "Kein Code-Ablaufdatum angegeben."}</p>
          <p className="text-xs text-zinc-500">Zahlungsreferenz: {created.payment_id}</p>
          <button type="button" onClick={reset} className="w-full rounded-lg border border-zinc-300 px-4 py-3 font-semibold dark:border-zinc-700">Neuen Vorgang beginnen</button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="bq-member-search" className="block text-sm font-semibold">Mitglied nach Namen suchen</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-500" aria-hidden="true" />
              <input id="bq-member-search" value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); setCashReceived(false); }} placeholder="z. B. Mimoun" autoComplete="off" className="w-full rounded-lg border border-zinc-300 bg-transparent py-3 pl-10 pr-3 text-sm dark:border-zinc-700" />
            </div>
            {searching && <p className="text-xs text-zinc-500">Mitglieder werden geladen …</p>}
            {searchError && <p role="alert" className="text-sm text-red-600">Mitgliedersuche: {searchError}</p>}
            {!searching && !searchError && members.length === 0 && <p className="text-xs text-zinc-500">Keine Mitglieder gefunden.</p>}
            <div className="max-h-60 space-y-2 overflow-y-auto" role="group" aria-label="Suchergebnisse">
              {members.map((member) => (
                <button key={member.user_id} type="button" onClick={() => { setSelected(member); setCashReceived(false); }} aria-pressed={selected?.user_id === member.user_id}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${selected?.user_id === member.user_id ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800"}`}>
                  <span className="flex items-center justify-between gap-2"><strong>{member.username || "Ohne Benutzername"}</strong>{selected?.user_id === member.user_id && <CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Ausgewählt" />}</span>
                  <span className="mt-1 block text-xs text-zinc-500">Level {member.member_level} · {member.total_xp} XP · ID {member.user_id.slice(0, 8)}…</span>
                </button>
              ))}
            </div>
            {selected && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-300">Ausgewählt: <strong>{selected.username || "Mitglied"}</strong> · {selected.user_id}</p>}
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Laufzeit auswählen</legend>
            {PLANS.map((p) => (
              <label key={p.days} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <span className="flex items-center gap-2"><input type="radio" name="duration" checked={duration === p.days} onChange={() => { setDuration(p.days); setCashReceived(false); }} /> <span className="text-sm">{p.label}</span></span>
                <strong className="whitespace-nowrap text-sm">{p.price}</strong>
              </label>
            ))}
          </fieldset>
          <div className="space-y-1">
            <label htmlFor="bq-note" className="block text-sm font-semibold">Interne Notiz (optional)</label>
            <textarea id="bq-note" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="z. B. Belegnummer" className="w-full rounded-lg border border-zinc-300 bg-transparent p-3 text-sm dark:border-zinc-700" />
          </div>
          <div className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500">Zu dokumentierende Barzahlung</p>
            <p className="text-2xl font-bold">{plan.price}</p>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={cashReceived} onChange={(e) => setCashReceived(e.target.checked)} className="mt-1" />
            <span>Ich bestätige, dass ich <strong>{plan.price} tatsächlich in bar erhalten</strong> habe und die Zahlung jetzt dokumentieren möchte.</span>
          </label>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
          <button type="button" disabled={loading || !cashReceived || !selected} onClick={generate} className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900">
            <KeyRound className="h-4 w-4" /> {loading ? "Wird erstellt …" : "Barzahlung erfassen & Code generieren"}
          </button>
          <p className="text-xs text-zinc-500">Der Code gilt nur für das ausgewählte Mitglied und kann einmalig eingelöst werden. Keine Testcodes ohne dokumentierten Zahlungseingang erstellen.</p>
        </div>
      )}
    </section>
  );
}
