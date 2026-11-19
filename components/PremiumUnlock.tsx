"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Status = { is_premium: boolean; premium_until: string | null };
export default function PremiumUnlock({ contactEmail = "" }: { contactEmail?: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function refresh() {
    const { data, error } = await getSupabase().rpc("bq_my_premium_status");
    if (error) { setMessage(error.message); return; }
    setStatus((Array.isArray(data) ? data[0] : data) as Status);
  }
  useEffect(() => { void refresh(); }, []);
  async function redeem() {
    if (!code.trim() || busy) return;
    setBusy(true); setMessage("");
    const { error } = await getSupabase().rpc("bq_redeem_premium_code", { p_code: code.trim() });
    if (error) setMessage("Code ungültig, abgelaufen oder nicht für dein Konto bestimmt.");
    else { setCode(""); setMessage("Premium freigeschaltet! Bitte Seite aktualisieren."); await refresh(); }
    setBusy(false);
  }
  return <section className="rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-white space-y-4" aria-label="Premium freischalten">
    <div><p className="text-xs font-bold tracking-widest text-lime-300">BODYQUEST PREMIUM</p><h2 className="text-2xl font-bold">Dein nächstes Level wartet.</h2>
    <p className="mt-2 text-sm text-zinc-300">Bis Level 5 trainierst du kostenlos. Für Level 6 und höher benötigst du Premium. Deine XP und bisherigen Fortschritte bleiben erhalten.</p></div>
    {status?.is_premium ? <p className="rounded-lg bg-lime-900/40 p-3 text-lime-200">Premium aktiv bis {status.premium_until ? new Date(status.premium_until).toLocaleDateString("de-DE") : "auf Weiteres"}</p> : <>
      <div className="grid grid-cols-2 gap-2 text-sm"><div className="rounded-lg bg-zinc-900 p-3">30 Tage <b className="block">7,99 €</b></div><div className="rounded-lg bg-zinc-900 p-3">90 Tage <b className="block">19,99 €</b></div><div className="rounded-lg bg-zinc-900 p-3">365 Tage <b className="block">59,99 €</b></div></div>
      <p className="text-sm text-zinc-300">Zahlung zunächst persönlich in bar oder nach Absprache per PayPal. Nach bestätigter Zahlung erhältst du einen persönlichen Einmalcode. Keine automatische Verlängerung.</p>
      {contactEmail ? <a className="inline-block rounded-lg bg-white px-4 py-2 font-semibold text-black" href={`mailto:${contactEmail}?subject=BodyQuest%20Premium%20freischalten`}>Premium per E-Mail anfragen</a> : <p className="text-sm text-amber-200">Kontaktiere den BodyQuest-Admin persönlich, um Premium zu buchen.</p>}
      <label htmlFor="bq-premium-code" className="block text-sm font-semibold">Deinen Freischaltcode eingeben</label>
      <input id="bq-premium-code" value={code} onChange={e=>setCode(e.target.value)} autoComplete="off" placeholder="BQ-…" className="w-full rounded-lg border border-zinc-600 bg-zinc-900 p-3 text-white" />
      <button type="button" disabled={busy || !code.trim()} onClick={()=>void redeem()} className="w-full rounded-lg bg-lime-300 px-4 py-3 font-bold text-black disabled:opacity-40">{busy ? "Wird geprüft …" : "Premium freischalten"}</button>
    </>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
