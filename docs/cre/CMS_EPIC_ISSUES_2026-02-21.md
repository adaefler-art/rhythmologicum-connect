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
| CMS-E1-01 | Block-Contract v1 + Content-Typen | P0 | S-M | todo | - |
| CMS-E1-02 | Patient Block-Renderer v1 (Block-First) | P0 | M | todo | CMS-E1-01 |
| CMS-E1-03 | Resolver/API um `blocks` erweitern | P0 | M | todo | CMS-E1-01 |
| CMS-E1-04 | CMS-Plattformentscheidung (Payload vs SaaS) | P1 | S | todo | CMS-E1-01 |
| CMS-E1-05 | CMS-Integration (Sync/Webhook + Preview) | P1 | M-L | todo | CMS-E1-02, CMS-E1-03, CMS-E1-04 |
| CMS-E1-06 | Editorial Workflow + Rollen + Audit | P1 | M | todo | CMS-E1-05 |
| CMS-E1-07 | QA/Security/Monitoring Content-Pipeline | P1 | M | todo | CMS-E1-05 |

---

## Detaillierte Issues (abarbeitbar)

### [ ] CMS-E1-01 — Block-Contract v1 + Content-Typen
- **Status**: todo
- **Owner**: Backend + Patient UI
- **Ziel**: Einheitliches Block-Schema für CMS und Frontend-Renderer schaffen.
- **Tasks**:
  - [ ] Block-Schema v1 dokumentieren (`hero`, `rich_text`, `image`, `badge`, `cta`)
  - [ ] `ContentPage`-Typen um optionales `blocks`-Feld erweitern (backward-compatible)
  - [ ] JSON-Schema/Validator für Block-Payload ergänzen
- **Akzeptanzkriterien**:
  - [ ] Schema-Dokument liegt versioniert in `docs/cre`
  - [ ] Typen in App und API kompilieren ohne Breaking Changes
  - [ ] Ungültige Blocktypen werden technisch abgefangen

### [ ] CMS-E1-02 — Patient Block-Renderer v1 (Block-First)
- **Status**: todo
- **Owner**: Patient UI
- **Ziel**: Contentseiten rendern primär aus `blocks[]`, mit `body_markdown` als Fallback.
- **Tasks**:
  - [ ] `ContentBlockRenderer`-Entry mit Allowlist-Blocktypen implementieren
  - [ ] Route `/patient/content/[slug]` auf Block-First umstellen
  - [ ] Bestehendes Markdown-Rendering als kompatibler Fallback erhalten
- **Akzeptanzkriterien**:
  - [ ] Seiten mit `blocks[]` rendern korrekt auf Mobile/Desktop
  - [ ] Seiten ohne `blocks[]` funktionieren unverändert
  - [ ] Keine freie HTML-Ausführung im Renderer möglich

### [ ] CMS-E1-03 — Resolver/API um `blocks` erweitern
- **Status**: todo
- **Owner**: Backend
- **Ziel**: Resolver und API liefern Block-Daten konsistent aus.
- **Tasks**:
  - [ ] `content_pages` Read-Pfade um `blocks` (oder referenzierte Block-Struktur) erweitern
  - [ ] Resolver-Kontrakt (`getContentPage`) für Block-Ausgabe anpassen
  - [ ] Fehler-/Fallback-Verhalten für fehlende/inkonsistente Blockdaten ergänzen
- **Akzeptanzkriterien**:
  - [ ] API liefert `blocks` für veröffentlichte Seiten deterministisch
  - [ ] 404-/Fallback-Logik bleibt konsistent
  - [ ] Keine Regression in `content-slider` und Slug-Routen

### [ ] CMS-E1-04 — CMS-Plattformentscheidung (Payload vs SaaS)
- **Status**: todo
- **Owner**: Product + Tech Lead + Ops
- **Ziel**: Verbindliche Plattformentscheidung anhand Governance-/Betriebskriterien.
- **Tasks**:
  - [ ] Entscheidungsmatrix (Datenresidenz, Security, Kosten, Betriebsaufwand, Workflow)
  - [ ] POC-Check mit 1-2 Beispielseiten
  - [ ] Entscheidung dokumentieren inkl. ADR-ähnlicher Begründung
- **Akzeptanzkriterien**:
  - [ ] Entscheidung ist schriftlich dokumentiert und freigegeben
  - [ ] Betriebspfad (SaaS oder self-hosted) ist klar beschrieben

### [ ] CMS-E1-05 — CMS-Integration (Sync/Webhook + Preview)
- **Status**: todo
- **Owner**: Backend + Patient UI
- **Ziel**: Inhalte aus CMS automatisiert in die App liefern, inkl. Vorschau.
- **Tasks**:
  - [ ] Publish-Webhook oder Pull-Sync implementieren
  - [ ] Preview-Mechanismus für Draft-Inhalte aufsetzen (rollenbasiert)
  - [ ] Cache-Invalidierung/Revalidate-Flows definieren
- **Akzeptanzkriterien**:
  - [ ] Veröffentlichung erscheint ohne Code-Deploy in der App
  - [ ] Draft ist nur im Preview sichtbar, nicht öffentlich
  - [ ] Sync-/Webhook-Fehler sind observierbar und recoverbar

### [ ] CMS-E1-06 — Editorial Workflow + Rollen + Audit
- **Status**: todo
- **Owner**: Product + Security + Backend
- **Ziel**: Redaktionsprozess kontrolliert und revisionsfähig machen.
- **Tasks**:
  - [ ] Workflow `draft -> review -> published -> archived` verbindlich einführen
  - [ ] Rollenmodell (`editor`, `reviewer`, `publisher`) abbilden
  - [ ] Audit-Events (wer/wann/was) erfassen
- **Akzeptanzkriterien**:
  - [ ] Veröffentlichungen sind rollenbasiert abgesichert
  - [ ] Änderungen und Publishes sind nachvollziehbar protokolliert

### [ ] CMS-E1-07 — QA/Security/Monitoring Content-Pipeline
- **Status**: todo
- **Owner**: QA + Backend + Patient UI
- **Ziel**: Laufende Qualität und Sicherheit für Content-Auslieferung sicherstellen.
- **Tasks**:
  - [ ] Testmatrix für `published`/`draft`/`404`/XSS/Responsive definieren
  - [ ] Automatisierte Smoke-Checks für kritische Contentpfade ergänzen
  - [ ] Monitoring/Alerting für Render-/Sync-Fehler aktivieren
- **Akzeptanzkriterien**:
  - [ ] Kritische Contentpfade sind reproduzierbar testbar
  - [ ] Sicherheitsprüfungen (XSS/HTML-Policy) dokumentiert und bestanden
  - [ ] Alerting auf Pipeline-Fehler aktiv

---

## Referenzen

- `docs/cre/CONTENT_CMS_ARCHITECTURE_2026-02-21.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-19.md`
- `apps/rhythm-patient-ui/app/patient/(mobile)/content/[slug]/page.tsx`
- `lib/utils/contentResolver.ts`
- `lib/types/content.ts`
