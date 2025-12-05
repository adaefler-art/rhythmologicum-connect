## Beschreibung


## Checkliste vor Merge
- [ ] Migration(s) hinzugefügt unter `supabase/migrations/` (ein Migration pro Änderung)
- [ ] Lokale Migration getestet: Migration auf eine frische DB angewendet und funktioniert
- [ ] `schema.sql` aktualisiert (z. B. `pg_dump -s --no-owner --no-privileges > schema.sql`) und committed
- [ ] DB‑abhängige Tests erfolgreich lokal ausgeführt / CI besteht
- [ ] Prisma/ORM Schema (z. B. schema.prisma) aktualisiert und ggf. `prisma migrate`/`prisma db push` überprüft
- [ ] Breaking changes dokumentiert & Rollback‑Plan beschrieben (falls destruktive Änderungen)
- [ ] Reviewer: @
