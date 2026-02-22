# CMS-E1-07 Smoke & Monitoring Runbook (Stand 2026-02-22)

## Ziel

Kritische CMS-Pfade reproduzierbar testen und bei Fehlern schnell erkennen:

- Sync (`/api/cms/payload/sync`)
- Webhook (`/api/cms/payload/webhook`)
- Preview (`/api/cms/payload/preview`, `/api/cms/payload/preview/disable`)

## Automatisierte Smoke-Checks

Implementiert:

- Route-Smoke-Tests: `apps/rhythm-patient-ui/app/api/cms/payload/__tests__/routes.smoke.test.ts`
- Access-Tests: `lib/cms/payload/__tests__/access.test.ts`
- Transform-Tests: `lib/cms/payload/__tests__/sync.test.ts`

Empfohlene Ausführung:

```bash
npm test -- apps/rhythm-patient-ui/app/api/cms/payload/__tests__/routes.smoke.test.ts --runInBand
npm test -- lib/cms/payload/__tests__/access.test.ts lib/cms/payload/__tests__/sync.test.ts --runInBand
```

## Testmatrix (E1-07)

1. Auth-Fail (`401`) für Sync ohne Secret/Rolle
2. Auth-Fail (`401`) für Webhook ohne Secret
3. Success (`200`) für Sync mit gültigem Zugriff
4. Success (`200`) für Webhook mit gültigem Secret
5. Partial (`207`) bei nicht-fatalen Sync-Fehlern
6. Hard-Fail (`500`) bei Upstream-/DB-Fehlern
7. Preview-Enable validiert Secret/Rolle und redirectet
8. Preview-Disable validiert Secret/Rolle und redirectet

## Monitoring & Alerting

Instrumentierung:

- `lib/cms/payload/monitoring.ts`
- standardisierte Usage-Telemetrie pro Route über `recordUsage`
- 5xx-Fehler erzeugen explizite Alert-Logs (`[cms/payload][alert]`)

Beobachtete Route Keys:

- `POST /api/cms/payload/sync`
- `POST /api/cms/payload/webhook`
- `GET /api/cms/payload/preview`
- `GET /api/cms/payload/preview/disable`

## Operativer Incident-Flow

Bei `5xx` in CMS-Pfaden:

1. Alert-Log prüfen (`[cms/payload][alert]` + `errorCode`)
2. Dry-Run-Sync ausführen (`/api/cms/payload/sync` mit `dryRun=true`)
3. Secret-/Payload-Konfiguration prüfen
4. Nach Fix: erneuter Sync und Route-Smoke-Tests

## Referenzen

- `docs/cre/CMS_E1_05_PAYLOAD_INTEGRATION_BLUEPRINT_2026-02-21.md`
- `docs/cre/CMS_EPIC_ISSUES_2026-02-21.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-19.md`
