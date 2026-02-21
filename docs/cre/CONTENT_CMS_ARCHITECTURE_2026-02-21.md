# Content-/CMS-Architektur für PAT-Inhaltsseiten (Stand 2026-02-21)

## Ziel

Für patient-facing Inhaltsseiten (z. B. „Was ist Stress?", Schlafhygiene, Auszeichnungen, redaktionelle Landingpages) wird ein skalierbarer Redaktionsprozess benötigt, ohne das bestehende Designsystem zu brechen.

## Kurzentscheidung

Empfehlung für v0.8/v0.9:

1. Kein eigenes CMS von Grund auf bauen.
2. Headless CMS extern oder self-hosted nutzen.
3. In der App nur einen sicheren, designkonformen Block-Renderer betreiben.
4. HTML-Einbettung nur als streng kontrollierter Ausnahmeweg (sanitized + allowlist).

## Warum diese Entscheidung

Bestehende Basis im Repo:

- Es gibt bereits `content_pages` inkl. Resolver/Fallback-Logik.
- Es gibt bereits Markdown-Rendering mit `skipHtml=true` (XSS-reduziert).
- Es gibt produktive Pfade wie `/patient/content/[slug]` und `content-slider`.

Das reduziert Integrationsrisiko erheblich: Statt Komplettneubau sollte die bestehende Content-Pipeline auf „strukturierte Blöcke + Redaktionsworkflow" erweitert werden.

## Architektur-Zielbild

### 1) Authoring (Redaktion)

- Redakteur:innen pflegen Seiten in einem Headless CMS (Entwurf, Vorschau, Freigabe, Publish).
- Inhalte bestehen aus strukturierten Blöcken (nicht aus freiem HTML):
  - Hero (Titel, Untertitel, Bild)
  - RichText/Markdown
  - Bild mit Caption/Alt
  - Auszeichnung/Badge-Block
  - CTA-Link/Teaser
  - FAQ/Accordion (optional)

### 2) Content Store/Sync

Zwei praktikable Varianten:

- Variante A (empfohlen für schnellen Start):
  - CMS ist Source of Truth.
  - Next.js liest via API/Webhook + optional Caching.
- Variante B (empfohlen für hohe Auditierbarkeit):
  - CMS schreibt via Sync-Job/Webhook in Supabase `content_pages` (+ neue Block-Tabelle/JSON-Feld).
  - App liest weiterhin primär aus Supabase.

Für euren aktuellen Stack ist Variante B besonders anschlussfähig, da bereits viel Logik auf Supabase-Tabellen basiert.

### 3) Delivery (Patient UI)

- Serverseitige Auflösung über bestehenden Resolver (`funnel`, `slug`, `status=published`).
- Renderer rendert ausschließlich erlaubte Blocktypen.
- Globales Design bleibt durch feste Komponenten/Tokens kontrolliert.
- Unknown Block Types werden soft-fail geloggt und nicht gerendert.

### 4) Governance/Sicherheit

- Status-Workflow: `draft` -> `review` -> `published` -> `archived`.
- Rollen: Editor, Reviewer, Publisher.
- Audit: Änderungs- und Veröffentlichungsprotokoll.
- Security: keine ungesäuberten HTML-Blobs im Patient-Frontend.

## Build vs. Externer Editor (klare Abgrenzung)

### Was nicht empfohlen ist

- Freies Einfügen von HTML aus beliebigen WYSIWYG-Tools in Patient-Seiten.
- Direkte Darstellung fremder iframes/scripts ohne strikte allowlist.

### Was funktioniert

- Externer Editor/CMS: Ja.
- Aber Ausgabeformat sollte strukturiert sein (JSON-Blocks oder Markdown + Metadaten), nicht beliebiges HTML.

## Tool-Optionen (für euren Kontext)

### Payload CMS (self-hosted)

- Pros: volle Datenhoheit, starke Next.js/TypeScript-Nähe, flexibel für Rollen/Workflows.
- Cons: eigener Betriebsaufwand.

### Storyblok / Contentful / Sanity (SaaS)

- Pros: schneller Start, sehr gute Editorial UX, Preview/Webhooks out-of-the-box.
- Cons: Vendor-Abhängigkeit, laufende Kosten, ggf. Datenresidenz prüfen.

## Empfohlener Migrationspfad (inkrementell)

## Phase 0 (1-2 Tage) – Contract festlegen

- Block-Schema v1 definieren (`hero`, `rich_text`, `image`, `badge`, `cta`).
- API-Antwortschema für Content-Seite fixieren:
  - `id`, `slug`, `status`, `title`, `excerpt`, `seo`, `blocks[]`, `updated_at`.

Exit:

- JSON-Schema dokumentiert und von Frontend + Backend abgestimmt.

## Phase 1 (3-5 Tage) – Renderer v1 in bestehender Seite

- In `/patient/content/[slug]` zuerst `blocks[]` rendern, fallback auf `body_markdown`.
- Block-Komponenten mit bestehendem Designsystem.
- Feature Flag für schrittweise Aktivierung.

Exit:

- Bestehende Seiten unverändert lauffähig, neue Seiten können Block-basiert ausgeliefert werden.

## Phase 2 (3-5 Tage) – CMS-Anbindung

- CMS auswählen und Content-Model an Block-Schema anpassen.
- Publish-Webhook auf Sync-Endpunkt (oder direkte API-Abfrage mit Cache-Inval).
- Assets in kontrollierter Media-Pipeline (Alt-Text Pflicht).

Exit:

- Redaktion kann ohne Deploy neue Inhalte veröffentlichen.

## Phase 3 (2-4 Tage) – Governance + QA

- Review/Approval-Workflow aktivieren.
- Smoke-Tests für Published/Draft/404/Rendering/XSS.
- Monitoring für Rendering-Fehler pro Blocktyp.

Exit:

- Production-ready Prozess mit nachvollziehbarer Freigabe.

## Konkrete technische Leitplanken für PAT

- Keine patientenspezifischen Daten in redaktionellen Content-Seiten.
- Safety-relevante Texte (z. B. Eskalationshinweise) über versionierte, geprüfte Textbausteine.
- Fallback bei CMS-Ausfall: letzte publizierte Version aus Supabase/Cache.
- Striktes Sanitizing für RichText-Inhalte (auch wenn HTML deaktiviert ist).

## Entscheidungsvorlage

Wenn primär schnell live gehen:

- Storyblok/Contentful/Sanity + Block-Renderer + Webhooks.

Wenn primär Datenhoheit/Audit im Fokus:

- Payload self-hosted + Sync nach Supabase + bestehende Resolver-Logik weiterverwenden.

Für Rhythmologicum Connect mit bestehender Supabase-Content-Basis ist folgende Reihenfolge am robustesten:

1. Block-Schema + Renderer in bestehender Pipeline.
2. Danach CMS anbinden.
3. Danach Freigabe-Workflow und Audit vertiefen.

## Nächste konkrete Umsetzung im Repo

1. Typ `ContentPage.blocks` ergänzen (optional, backward-compatible).
2. Neues `ContentBlockRenderer`-Entry mit Allowlist-Blocktypen.
3. `apps/rhythm-patient-ui/app/patient/(mobile)/content/[slug]/page.tsx` auf Block-First + Markdown-Fallback umstellen.
4. API/Resolver leicht erweitern, damit `blocks` immer mitgeliefert werden.
5. Verifikation in bestehende Test-Checklisten aufnehmen (`published`, `draft`, `404`, XSS, responsive).
