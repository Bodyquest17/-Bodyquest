"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Copy, KeyRound, ShieldCheck } from "lucide-react";

type Plan = 30 | 90 | 180 | 365;
const PLANS: { days: Plan; label: string; price: string }[] = [
  { days: 30, label: "30 Tage", price: "7,99 €" },
  { days: 90, label: "90 Tage", price: "19,99 €" },
  { days: 180, label: "180 Tage · Admin-Sonderlaufzeit", price: "34,99 €" },
  { days: 365, label: "365 Tage", price: "59,99 €" },
];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CreatedCode = {
  code: string;
  payment_id: string;
  code_id: string;
  amount_cents: number;
  duration_days: number;
  code_expires_at: string;
};

export default function PremiumCodeGenerator() {
  const [userId, setUserId] = useState("");
  const [duration, setDuration] = useState<Plan>(90);
  const [note, setNote] = useState("");
  const [cashReceived, setCashReceived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedCode | null>(null);
  const [copied, setCopied] = useState(false);
  const plan = PLANS.find((p) => p.days === duration)!;

  async function generate() {
    if (loading || created) return;
    setError("");
    if (!UUID_RE.test(userId.trim())) {
      setError("Bitte eine gültige Supabase-Benutzer-ID (UUID) eingeben.");
      return;
    }
    if (!cashReceived) {
      setError("Bitte erst bestätigen, dass die Barzahlung tatsächlich eingegangen ist.");
      return;
    }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Bitte melde dich als Admin an.");
      const { data, error: rpcError } = await supabase.rpc("bq_create_premium_code", {
        p_user_id: userId.trim(),
        p_duration_days: duration,
        p_note: note.trim() || null,
      });
      if (rpcError) throw new Error(rpcError.message);
      const result = (Array.isArray(data) ? data[0] : data) as CreatedCode | undefined;
      if (!result?.code) throw new Error("Kein Code zurückgegeben. Bitte Zahlungshistorie prüfen, bevor du es erneut versuchst.");
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
      setError("Automatisches Kopieren nicht möglich. Bitte den Code manuell markieren.");
    }
  }

  function reset() {
    setCreated(null);
    setUserId("");
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
          <p className="text-sm text-zinc-500">Nur für berechtigte BodyQuest-Admins</p>
        </div>
      </div>

      {created ? (
        <div className="space-y-4" role="status">
          <div className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" /> Code erstellt und Barzahlung dokumentiert
          </div>
          <p className="text-sm">Diesen Code jetzt sicher an das zugehörige Mitglied übergeben. Er wird nur hier einmalig angezeigt.</p>
          <div className="break-all rounded-lg border border-zinc-300 bg-zinc-50 p-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900" aria-label="Premiumcode">
            {created.code}
          </div>
          <button type="button" onClick={copyCode} className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
            <Copy className="h-4 w-4" /> {copied ? "Kopiert" : "Code kopieren"}
          </button>
          <p className="text-sm text-zinc-500">Laufzeit: {created.duration_days} Tage ab Einlösung. Code gültig bis: {new Date(created.code_expires_at).toLocaleString("de-DE")}.</p>
          <p className="text-xs text-zinc-500">Zahlungsreferenz: {created.payment_id}</p>
          <button type="button" onClick={reset} className="w-full rounded-lg border border-zinc-300 px-4 py-3 font-semibold dark:border-zinc-700">Neuen Vorgang beginnen</button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="bq-user-id" className="block text-sm font-semibold">Mitglieds-ID (UUID)</label>
            <input id="bq-user-id" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autoComplete="off" className="w-full rounded-lg border border-zinc-300 bg-transparent p-3 text-sm dark:border-zinc-700" />
            <p className="text-xs text-zinc-500">Die ID findest du in Supabase unter Authentication → Users. Nicht die E-Mail eingeben.</p>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Laufzeit auswählen</legend>
            {PLANS.map((p) => (
              <label key={p.days} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <span className="flex items-center gap-2"><input type="radio" name="duration" checked={duration === p.days} onChange={() => setDuration(p.days)} /> <span className="text-sm">{p.label}</span></span>
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
          <button type="button" disabled={loading || !cashReceived || !UUID_RE.test(userId.trim())} onClick={generate} className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900">
            <KeyRound className="h-4 w-4" /> {loading ? "Wird erstellt …" : "Barzahlung erfassen & Code generieren"}
          </button>
          <p className="text-xs text-zinc-500">Ein Code ist nur für die ausgewählte Benutzer-ID gültig und kann einmalig eingelöst werden. Die Codeeinlösung durch Mitglieder folgt im nächsten Schritt.</p>
        </div>
      )}
    </section>
  );
}
