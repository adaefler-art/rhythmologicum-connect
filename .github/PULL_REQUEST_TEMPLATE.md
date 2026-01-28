## Beschreibung


## Checkliste vor Merge
- [ ] Migration(s) hinzugefügt unter `supabase/migrations/` (ein Migration pro Änderung)
- [ ] Lokale Migration getestet: Migration auf eine frische DB angewendet und funktioniert
- [ ] `schema.sql` aktualisiert (z. B. `pg_dump -s --no-owner --no-privileges > schema.sql`) und committed
- [ ] DB‑abhängige Tests erfolgreich lokal ausgeführt / CI besteht
- [ ] Prisma/ORM Schema (z. B. schema.prisma) aktualisiert und ggf. `prisma migrate`/`prisma db push` überprüft
- [ ] Breaking changes dokumentiert & Rollback‑Plan beschrieben (falls destruktive Änderungen)
- [ ] Neue interne Endpoints im selben PR mindestens einmal verdrahtet (literal Callsite, ggf. hinter Feature‑Flag)
- [ ] Externe Endpoints: in `docs/api/endpoint-allowlist.json` aufgenommen inkl. Begründung

## Contracts & Environment (E50 - No Fantasy Names)
- [ ] **Evidence**: Neue Identifier nutzen `lib/contracts/registry.ts` (oder begründen, warum nicht)
- [ ] **Evidence**: Neue Environment Variables nutzen `lib/env.ts` (oder begründen, warum nicht)
- [ ] **Evidence**: Keine direkten `process.env.*` Zugriffe hinzugefügt (außer in `lib/env.ts` selbst)
- [ ] **Memory Entry**: Falls neue Patterns/Konventionen eingeführt wurden, Memory-Eintrag angelegt via `store_memory` Tool

## Testing Evidence
- [ ] **Preflight**: npm run preflight ausgeführt (Output angehängt)
- [ ] **Evidence**: Tests ausgeführt (lokal oder CI-Link)
- [ ] **Evidence**: Manuelle Tests durchgeführt (Beschreibung oder Screenshots)
- [ ] **Evidence**: Keine Regressionen in bestehender Funktionalität

## Reviewer
- [ ] Reviewer: @
