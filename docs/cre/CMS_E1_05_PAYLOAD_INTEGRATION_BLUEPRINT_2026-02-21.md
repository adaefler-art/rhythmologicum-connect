# CMS-E1-05 Payload Integration Blueprint (Stand 2026-02-21)

## Ziel

Payload CMS in die bestehende PAT-Content-Pipeline integrieren, sodass:

- Inhalte ohne Deploy synchronisiert werden können
- Preview für Draft-Inhalte kontrolliert nutzbar ist
- Revalidate nach Publish-Events deterministisch erfolgt
- Fehlerpfade transparent und recoverbar bleiben

## Umsetzungsumfang (technischer Slice)

Implementiert:

- Payload Sync-Service (inkl. Dry-Run): `lib/cms/payload/sync.ts`
- API Endpoint für manuellen/automatisierten Sync: `POST /api/cms/payload/sync`
- API Endpoint für Payload Webhook: `POST /api/cms/payload/webhook`
- Preview aktivieren: `GET /api/cms/payload/preview?secret=...&slug=...`
- Preview deaktivieren: `GET /api/cms/payload/preview/disable`
- Transform/Markdown-Fallback Tests: `lib/cms/payload/__tests__/sync.test.ts`
- Access-Guard (Secret ODER Clinician/Admin): `lib/cms/payload/access.ts`
- Audit-Logging für CMS-Operationen: `lib/cms/payload/audit.ts`

## Endpoint-Contract

## 1) POST `/api/cms/payload/sync`

Auth:

- Header `x-cms-sync-secret` muss `CMS_PAYLOAD_SYNC_SECRET` entsprechen

Body (optional):

```json
{
  "dryRun": true,
  "slug": "stress-verstehen",
  "publishedOnly": true
}
```

Verhalten:

- Lädt Payload-Dokumente über API
- Transformiert auf `content_pages`-Schema
- Upsert per `slug` (bei `dryRun=false`)
- Revalidate für `/patient/start` und optional die Slug-Seite

## 2) POST `/api/cms/payload/webhook`

Auth:

- Header `x-cms-webhook-secret` muss `CMS_PAYLOAD_WEBHOOK_SECRET` entsprechen

Payload (vereinfachtes Beispiel):

```json
{
  "event": "afterChange",
  "doc": {
    "slug": "stress-verstehen",
    "status": "published"
  }
}
```

Verhalten:

- Triggert slug-bezogenen Sync
- Revalidiert Start + Contentroute
- Für Draft-Status kann `publishedOnly=false` verarbeitet werden

## 3) GET `/api/cms/payload/preview`

Query:

- `secret`: muss `CMS_PREVIEW_SECRET` entsprechen
- `slug`: Zielseite

Verhalten:

- Aktiviert Next Draft Mode
- Redirect auf `/patient/content/{slug}?preview=1`

## 4) GET `/api/cms/payload/preview/disable`

Verhalten:

- Deaktiviert Draft Mode
- Redirect auf `/patient/start`

## ENV-Contract

Für E1-05 erforderlich:

- `CMS_PAYLOAD_BASE_URL`
- `CMS_PAYLOAD_COLLECTION` (optional, default: `content-pages`)
- `CMS_PAYLOAD_API_TOKEN` (optional, falls Payload API geschützt)
- `CMS_PAYLOAD_SYNC_SECRET`
- `CMS_PAYLOAD_WEBHOOK_SECRET`
- `CMS_PREVIEW_SECRET`

## Transformationsregeln

Quelle Payload -> Ziel `content_pages`:

- `slug`, `title`, `excerpt`, `status`, `layout`, `category`, `priority`, `flow_step`
- `seo_title`, `seo_description`, `teaser_image_url`
- `funnel_slug` wird auf `funnel_id` aufgelöst (falls auflösbar)
- `blocks` werden aktuell nicht direkt persistiert, sondern als Markdown-Fallback in `body_markdown` überführt

Hinweis:

- Direkte `blocks`-Persistenz ist umgesetzt über Migration `20260222090000_add_blocks_to_content_pages.sql`.
- Sync enthält weiterhin einen 42703-Kompatibilitätsfallback für ältere Umgebungen ohne migriertes Schema.

## Fehlerpfade & Recovery

- Ungültiges Secret -> `401 UNAUTHORIZED`
- Fehlende Rolle bei role-basiertem Zugriff -> `403 FORBIDDEN`
- Payload API nicht erreichbar/ungültig -> `500 SYNC_FAILED`
- Funnel-Slug nicht auflösbar -> Teilfehler in Ergebnisliste, Sync läuft weiter
- DB-Upsert-Fehler -> `success=false` inkl. Fehlermeldung im Response

Recovery-Strategie:

1. Ursache beheben (Secret/URL/Token/DB)
2. `dryRun=true` ausführen zur Validierung
3. Danach `dryRun=false` für produktive Übernahme

## Offene Punkte für nächsten Schritt

- Direkte Persistenz von `blocks` nach DB-Migration
- RBAC-Policy für externen Webhook optional auf IP-allowlist/HMAC erweitern
- Observability (Metriken/Alerts) für Sync-Fehlerpfade

## Referenzen

- `docs/cre/CMS_PLATFORM_DECISION_ADR_2026-02-21.md`
- `docs/cre/CMS_EPIC_ISSUES_2026-02-21.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-19.md`
