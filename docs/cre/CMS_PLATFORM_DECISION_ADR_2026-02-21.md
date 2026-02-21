# ADR — CMS Plattformentscheidung (CMS-E1-04)

Status: accepted  
Datum: 2026-02-21  
Scope: patient-facing Contentseiten (`/patient/content/[slug]`, Slider/Teaser, redaktionelle Informationsseiten)

## Kontext

Für den CMS-Epic wird eine verbindliche Plattformentscheidung benötigt:

- Option A: Payload CMS (self-hosted)
- Option B: SaaS CMS (Storyblok/Contentful/Sanity)

Rahmenbedingungen aus dem Projekt:

- bestehende Supabase-basierte Content-Pipeline
- hoher Bedarf an Auditierbarkeit, Rollenkonzepten und deterministischem Fallback
- kliniknahes Umfeld mit erhöhtem Governance- und Compliance-Anspruch

## Bewertungsmethodik

Skala pro Kriterium: 1 (schwach) bis 5 (sehr gut)  
Gewichtete Gesamtsumme = `Score x Gewicht`

| Kriterium | Gewicht | Payload self-hosted | SaaS CMS |
|---|---:|---:|---:|
| Datenhoheit / Residenzsteuerung | 5 | 5 | 3 |
| Security & Compliance Kontrolltiefe | 5 | 5 | 3 |
| Integrationsfit zu Next.js/TypeScript | 4 | 5 | 4 |
| Integrationsfit zu bestehender Supabase-Pipeline | 4 | 4 | 4 |
| Editorial UX (out-of-the-box) | 3 | 3 | 5 |
| Time-to-Value (Initialsetup) | 3 | 3 | 5 |
| Betriebsaufwand intern | 2 | 2 | 5 |
| Vendor-Lock-in Risiko | 3 | 5 | 2 |
| Kostenkontrolle langfristig | 3 | 4 | 3 |

Gewichtete Summe:

- Payload self-hosted: `25 + 25 + 20 + 16 + 9 + 9 + 4 + 15 + 12 = 135`
- SaaS CMS: `15 + 15 + 16 + 16 + 15 + 15 + 10 + 6 + 9 = 117`

## POC-Check (Issue-Anforderung erfüllt)

POC-Definition:

1. Beispielseite „Was ist Stress?“ mit Block-Schema v1 (`hero`, `rich_text`, `image`, `badge`, `cta`) modellierbar
2. Änderungszyklus von Draft zu Publish inkl. Preview nachvollziehbar

Ergebnis:

- Beide Optionen erfüllen die funktionale POC-Mindestanforderung.
- Payload zeigt den besseren Governance-Fit für den Zielbetrieb mit eigenem Audit-/Rollenfokus.

## Entscheidung

Entscheidung: **Payload CMS (self-hosted) als Zielplattform**.

Begründung (kurz):

- Höchste Punktzahl in gewichteter Matrix.
- Bessere Kontrolltiefe für Security/Compliance/Datenresidenz.
- Stabiler Fit zum bereits umgesetzten Block-Contract und zur Supabase-zentrierten Delivery-Architektur.

## Konsequenzen

### Positiv

- Volle Kontrolle über Datenhaltung, Rollenmodell und Audit-Tiefe.
- Geringeres strategisches Lock-in-Risiko.
- Planbarer Migrationspfad über bestehende `content_pages`-Pipeline.

### Negativ

- Höherer initialer Betriebsaufwand (Hosting, Updates, Monitoring).
- Editorial UX muss ggf. gezielt konfiguriert/optimiert werden.

## Verbindlicher Umsetzungspfad (ab jetzt)

1. CMS-E1-05: Payload-Integration via Publish-Sync/Webhook nach Supabase + Preview-Pfad
2. CMS-E1-06: Rollen/Freigaben/Audit im redaktionellen Workflow
3. CMS-E1-07: Monitoring + Security/Smoke-Regression für Content-Pipeline

## Referenzen

- `docs/cre/CONTENT_CMS_ARCHITECTURE_2026-02-21.md`
- `docs/cre/CMS_EPIC_ISSUES_2026-02-21.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-19.md`
