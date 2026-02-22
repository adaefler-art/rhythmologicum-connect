# CMS Epic Issues Tracker (v0.8/v0.9)

Stand: 2026-02-21  
Quelle: `docs/cre/CONTENT_CMS_ARCHITECTURE_2026-02-21.md`

## Ziel

Headless-CMS-fähige Content-Pipeline für patient-facing Seiten etablieren, mit sicherem Block-Rendering, Redaktionsworkflow und kontrollierter Veröffentlichung.

## Nutzung

- Statuswerte: `todo` | `in_progress` | `review` | `done` | `blocked`
- Ein Issue ist erst `done`, wenn alle Akzeptanzkriterien erfüllt sind.
- Reihenfolge ist bindend, außer ein expliziter Architekturentscheid priorisiert um.

## Reihenfolge (verbindlich)

1. CMS-E1-01
2. CMS-E1-02
3. CMS-E1-03
4. CMS-E1-04
5. CMS-E1-05
6. CMS-E1-06
7. CMS-E1-07

---

## Issue-Liste (kompakt)

| ID | Titel | Prio | Aufwand | Status | Abhängigkeiten |
|---|---|---|---|---|---|
| CMS-E1-01 | Block-Contract v1 + Content-Typen | P0 | S-M | done | - |
| CMS-E1-02 | Patient Block-Renderer v1 (Block-First) | P0 | M | in_progress | CMS-E1-01 |
| CMS-E1-03 | Resolver/API um `blocks` erweitern | P0 | M | in_progress | CMS-E1-01 |
| CMS-E1-04 | CMS-Plattformentscheidung (Payload vs SaaS) | P1 | S | done | CMS-E1-01 |
| CMS-E1-05 | CMS-Integration (Sync/Webhook + Preview) | P1 | M-L | in_progress | CMS-E1-02, CMS-E1-03, CMS-E1-04 |
| CMS-E1-06 | Editorial Workflow + Rollen + Audit | P1 | M | in_progress | CMS-E1-05 |
| CMS-E1-07 | QA/Security/Monitoring Content-Pipeline | P1 | M | in_progress | CMS-E1-05 |

---

## Detaillierte Issues (abarbeitbar)

### [x] CMS-E1-01 — Block-Contract v1 + Content-Typen
- **Status**: done
- **Owner**: Backend + Patient UI
- **Ziel**: Einheitliches Block-Schema für CMS und Frontend-Renderer schaffen.
- **Tasks**:
  - [x] Block-Schema v1 dokumentieren (`hero`, `rich_text`, `image`, `badge`, `cta`)
  - [x] `ContentPage`-Typen um optionales `blocks`-Feld erweitern (backward-compatible)
  - [x] JSON-Schema/Validator für Block-Payload ergänzen
- **Akzeptanzkriterien**:
  - [x] Schema-Dokument liegt versioniert in `docs/cre`
  - [x] Typen in App und API kompilieren ohne Breaking Changes
  - [x] Ungültige Blocktypen werden technisch abgefangen

### [~] CMS-E1-02 — Patient Block-Renderer v1 (Block-First)
- **Status**: in_progress
- **Owner**: Patient UI
- **Ziel**: Contentseiten rendern primär aus `blocks[]`, mit `body_markdown` als Fallback.
- **Tasks**:
  - [x] `ContentBlockRenderer`-Entry mit Allowlist-Blocktypen implementieren
  - [x] Route `/patient/content/[slug]` auf Block-First umstellen
  - [x] Bestehendes Markdown-Rendering als kompatibler Fallback erhalten
- **Akzeptanzkriterien**:
  - [x] Seiten mit `blocks[]` rendern korrekt auf Mobile/Desktop
  - [x] Seiten ohne `blocks[]` funktionieren unverändert
  - [x] Keine freie HTML-Ausführung im Renderer möglich

### [~] CMS-E1-03 — Resolver/API um `blocks` erweitern
- **Status**: in_progress
- **Owner**: Backend
- **Ziel**: Resolver und API liefern Block-Daten konsistent aus.
- **Tasks**:
  - [x] `content_pages` Read-Pfade um `blocks` (oder referenzierte Block-Struktur) erweitern
  - [x] Resolver-Kontrakt (`getContentPage`) für Block-Ausgabe anpassen
  - [x] Fehler-/Fallback-Verhalten für fehlende/inkonsistente Blockdaten ergänzen
- **Akzeptanzkriterien**:
  - [x] API liefert `blocks` für veröffentlichte Seiten deterministisch
  - [x] 404-/Fallback-Logik bleibt konsistent
  - [ ] Keine Regression in `content-slider` und Slug-Routen

### [x] CMS-E1-04 — CMS-Plattformentscheidung (Payload vs SaaS)
- **Status**: done
- **Owner**: Product + Tech Lead + Ops
- **Ziel**: Verbindliche Plattformentscheidung anhand Governance-/Betriebskriterien.
- **Tasks**:
  - [x] Entscheidungsmatrix (Datenresidenz, Security, Kosten, Betriebsaufwand, Workflow)
  - [x] POC-Check mit 1-2 Beispielseiten
  - [x] Entscheidung dokumentieren inkl. ADR-ähnlicher Begründung
- **Akzeptanzkriterien**:
  - [x] Entscheidung ist schriftlich dokumentiert und freigegeben
  - [x] Betriebspfad (SaaS oder self-hosted) ist klar beschrieben

Ergebnis:

- Entscheidung: Payload CMS (self-hosted)
- Begründung und Matrix: `docs/cre/CMS_PLATFORM_DECISION_ADR_2026-02-21.md`

### [~] CMS-E1-05 — CMS-Integration (Sync/Webhook + Preview)
- **Status**: in_progress
- **Owner**: Backend + Patient UI
- **Ziel**: Inhalte aus CMS automatisiert in die App liefern, inkl. Vorschau.
- **Tasks**:
  - [x] Publish-Webhook oder Pull-Sync implementieren
  - [x] Preview-Mechanismus für Draft-Inhalte aufsetzen (Secret-geschützt)
  - [x] Cache-Invalidierung/Revalidate-Flows definieren
- **Akzeptanzkriterien**:
  - [x] Veröffentlichung erscheint ohne Code-Deploy in der App
  - [x] Draft ist nur im Preview sichtbar, nicht öffentlich
  - [x] Sync-/Webhook-Fehler sind observierbar und recoverbar

Aktueller Stand:

- Technischer Blueprint + Endpoint-Slice umgesetzt (`sync`, `webhook`, `preview`, `preview/disable`).
- Dokumentation: `docs/cre/CMS_E1_05_PAYLOAD_INTEGRATION_BLUEPRINT_2026-02-21.md`

### [~] CMS-E1-06 — Editorial Workflow + Rollen + Audit
- **Status**: in_progress
- **Owner**: Product + Security + Backend
- **Ziel**: Redaktionsprozess kontrolliert und revisionsfähig machen.
- **Tasks**:
  - [ ] Workflow `draft -> review -> published -> archived` verbindlich einführen
  - [~] Rollenmodell (`editor`, `reviewer`, `publisher`) abbilden
  - [~] Audit-Events (wer/wann/was) erfassen
- **Akzeptanzkriterien**:
  - [~] Veröffentlichungen sind rollenbasiert abgesichert
  - [~] Änderungen und Publishes sind nachvollziehbar protokolliert

Aktueller Stand:

- Backend-Guardrails aktiv: CMS-Sync/Preview erlauben Secret oder Rolle `clinician/admin`.
- Audit-Events für Sync/Webhook/Preview-Enable/Disable werden serverseitig protokolliert.

### [~] CMS-E1-07 — QA/Security/Monitoring Content-Pipeline
- **Status**: in_progress
- **Owner**: QA + Backend + Patient UI
- **Ziel**: Laufende Qualität und Sicherheit für Content-Auslieferung sicherstellen.
- **Tasks**:
  - [x] Testmatrix für `published`/`draft`/`404`/XSS/Responsive definieren
  - [x] Automatisierte Smoke-Checks für kritische Contentpfade ergänzen
  - [x] Monitoring/Alerting für Render-/Sync-Fehler aktivieren
- **Akzeptanzkriterien**:
  - [x] Kritische Contentpfade sind reproduzierbar testbar
  - [~] Sicherheitsprüfungen (XSS/HTML-Policy) dokumentiert und bestanden
  - [x] Alerting auf Pipeline-Fehler aktiv

Aktueller Stand:

- Smoke-Test-Suite für CMS-API-Pfade ergänzt (`routes.smoke.test.ts`).
- Monitoring-Instrumentierung mit Route-Key-Telemetrie + 5xx-Alert-Log aktiv (`lib/cms/payload/monitoring.ts`).
- Testmatrix/Runbook dokumentiert: `docs/cre/CMS_E1_07_SMOKE_MONITORING_2026-02-22.md`.

---

## Referenzen

- `docs/cre/CONTENT_CMS_ARCHITECTURE_2026-02-21.md`
- `docs/cre/CMS_PLATFORM_DECISION_ADR_2026-02-21.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-19.md`
- `apps/rhythm-patient-ui/app/patient/(mobile)/content/[slug]/page.tsx`
- `lib/utils/contentResolver.ts`
- `lib/types/content.ts`
