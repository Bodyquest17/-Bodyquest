# BODY QUEST – Architektur, Limits, Datenmodell, Plan

## 1. Kostenlose Limits (Stand November 2026, vor Livegang erneut prüfen)
| Dienst | Free-Limit | Folge für BODY QUEST |
|---|---|---|
| Supabase Free | 500 MB DB, 50.000 MAU, 5 GB Egress, 1 GB Storage, 2 Projekte | Für MVP ausreichend. **Projekt pausiert nach 7 Tagen Inaktivität** (manuelles Aufwecken nötig). |
| Vercel Hobby | 100 GB Traffic, 1M Edge Requests, 1 Nutzer | **Nur private, nicht-kommerzielle Nutzung.** Sobald Mitgliedschaften/Zahlungen live gehen: Pro ($20/Monat). |

Empfehlung: Entwicklung, Tests und kostenloser Closed-Beta auf Free. Vor öffentlichem Start mit Bezahlfunktion: Vercel Pro und Supabase Pro ($25/Monat, keine Pause).

## 2. Stolpersteine
- Adminrolle nie über Client/Registrierung: Rolle in eigener Tabelle `roles`, Schreibzugriff nur per Service-Role auf dem Server.
- Doppelte XP: Unique-Constraint (`user_id`, `quest_id`, `period_key`) plus Postgres-Funktion (RPC) in einer Transaktion.
- Zeitzone: `period_key` wird in der Datenbank aus `now() AT TIME ZONE 'Europe/Berlin'` berechnet, nie vom Client.
- Quest-XP ändern: `xp_awarded` wird beim Abschluss in `quest_completions` und `xp_transactions` eingefroren.
- Service-Role-Key nur in Server-Code und Vercel-Umgebungsvariablen.
- iOS-PWA: Installation über Safari "Zum Home-Bildschirm"; Push-Nachrichten bewusst nicht in V1.
- DSGVO: Datensparsamkeit, keine Gesundheitsdaten, Ranking nur per Opt-in, Löschung/Export vorbereitet.

## 3. Projektstruktur
```
app/
  layout.tsx, manifest.ts, globals.css, page.tsx
  (auth)/login, (auth)/registrieren
  (member)/dashboard | quests | challenges | fortschritt | profil
  admin/ (Übersicht, quests, challenges, mitglieder, statistiken, einstellungen, mitgliedschaften)
components/  BottomNav, AdminNav, XpBar, DayRing, EmptyState, PageHeader, PhaseNotice, Logo
lib/         xp.ts (Level), nav.ts
public/icons PWA-Icons
supabase/migrations   (ab Phase 2)
docs/
```

## 4. Navigation
Mitglieder (untere Leiste): Start · Quests · Challenges · Fortschritt · Profil
Admin (obere Leiste): Übersicht · Quests · Challenges · Mitglieder · Statistiken · Einstellungen · Mitgliedschaften

## 5. Datenbankschema (SQL-Migrationen in Phase 2)
- `profiles` (id → auth.users, display_name, ranking_opt_in, total_xp, level, current_streak, longest_streak, created_at)
- `roles` (user_id, role: 'ADMIN' | 'MEMBER') – Schreibzugriff nur Server
- `quests` (id, title, description, category, subcategory, difficulty, xp_reward, starts_on, ends_on, recurrence: once|daily|weekly, status: draft|published|archived, image_url, instructions, is_premium, required_plan)
- `quest_completions` (id, user_id, quest_id, period_key, xp_awarded, completed_at) – UNIQUE(user_id, quest_id, period_key)
- `xp_transactions` (id, user_id, amount, reason, source_type, source_id, created_at) – nur anhängen
- `challenges` (id, title, description, starts_on, ends_on, duration_days: 7|14|30, badge_id, status)
- `challenge_quests` (challenge_id, quest_id)
- `challenge_participants` (challenge_id, user_id, joined_at, completed_at)
- `achievements` (id, key, title, description, icon) / `user_achievements` (user_id, achievement_id, earned_at)
- `subscription_plans` (id, key: FREE|PRO|ELITE, name, price_cents, stripe_price_id)
- `subscriptions` (id, user_id, plan_id, status, current_period_end, stripe_customer_id, stripe_subscription_id)
RLS auf allen nutzerbezogenen Tabellen: Mitglieder sehen nur eigene Zeilen; Admin über `is_admin()`-Funktion.

## 6. Entwicklungsplan
1. Phase 1 – Struktur, Design, Navigation (dieses ZIP)
2. Phase 2 – Supabase, Auth, Rollen, RLS
3. Phase 3 – Admin-Questverwaltung (CRUD)
4. Phase 4 – Member-Dashboard, Quest-Abschluss, XP, Level
5. Phase 5 – Challenges, Streaks, Badges, Ranking
6. Phase 6 – PWA-Feinschliff, Tests, Sicherheit, Deployment
7. Phase 7 – Stripe (später)
