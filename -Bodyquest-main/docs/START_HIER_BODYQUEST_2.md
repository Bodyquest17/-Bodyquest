# BodyQuest 2.0 – Installation

## Wichtig vor dem Upload
Dies ist eine **Entwicklungsfassung**, kein vollständig produktionsgeprüftes Release. Die Live-Datenbank wurde nicht verändert. Sichere vorher den bisherigen GitHub-Stand und Supabase-Daten.

1. ZIP entpacken. Dateien im bestehenden GitHub-Repository hochladen, idealerweise in einem **neuen Branch** `bodyquest-arena` (nicht direkt `main`).
2. In Supabase > SQL Editor die Datei `docs/BODYQUEST_ARENA_SETUP.sql` ausführen. Vorher in einer Testumgebung prüfen. Die Migration erzeugt neue Tabellen und RPC-Funktionen.
3. Deinen Admin-Account freischalten: Supabase > Authentication > Users > deine **User-ID** kopieren. Danach im SQL Editor ausführen: `insert into public.arena_admins(user_id) values ('DEINE-USER-UUID') on conflict do nothing;` **Nicht die E-Mail eintragen.**
4. In Vercel eine Vorschau-Deployment für den neuen Branch öffnen. Bestehende `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` müssen vorhanden sein. Keine Geheimschlüssel im GitHub-Repository speichern.
5. Auf der Quest-Seite unten die Trainings-Arena öffnen. `/arena` testen. Admin-Codes unter `/admin/codes` testen.
6. **Wichtig:** Der vorhandene `/admin`-Bereich hat laut Quellcode noch keinen vollständigen serverseitigen Routenschutz. Die neuen Code-Operationen sind durch Datenbank-RPCs abgesichert, aber die restlichen Admin-Seiten müssen separat geprüft und geschützt werden.

## Was implementiert ist
- Arena-Einstieg unter den Quests, Bodyweight, Gym, Quick- und Recovery-Filter.
- 60 Übungseinträge, Suche, einfache Technik- und Sicherheitshinweise.
- Workout-Zusammenstellung und Satzprotokoll, Speicherung und Historie in Supabase.
- Level-5-Gate für eigene Workouts, persönlicher Einmalcode pro User-ID, Admin-Generierung, manuelle Freigabe und Widerruf.
- Servervalidierte Arena-XP (30/10, maximal 50 pro UTC-Tag), ohne automatische Veränderung des bisherigen XP-Kontos.

## Noch nicht vollständig umgesetzt
- Bestehendes Gesamt-XP-/Levelsystem mit Arena-XP synchronisieren; dazu müssen die bestehenden Supabase-RPCs im Live-Projekt geprüft werden.
- Ausführlicher Workout-Builder mit gespeicherten Vorlagen, Pausentimer, Gewichtsprogression, Skill-Bäumen und Übungsvideos.
- Admin-Übungseditor, Code-Audit-Log, Ablaufdaten und Rate-Limiting.
- Technische Produktionsprüfung inkl. vollständigem Next.js-Build, End-to-End-Tests und Datenbanktests.
- Bestehende Health-/Supplement-Routen sind noch nicht serverseitig durch die Level-5-Berechtigung geschützt.

**Nicht als fertige Premium-Zugangssperre verkaufen oder in Produktion schalten, bevor die offenen Punkte abgeschlossen sind.**
