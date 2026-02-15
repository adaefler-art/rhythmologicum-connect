# CRE Implementierungs-Backlog (Stand 2026-02-15)

## Zweck
Dieses Dokument übersetzt die CRE-Canvas-Quellen aus `docs/cre/source` in ein umsetzbares Engineering-Backlog.

Ziele:
- klare Priorisierung (P0 → P3)
- belastbare Arbeitspakete mit Akzeptanzkriterien
- eindeutige Reihenfolge für Delivery
- Anschluss an bestehende CRE-Artefakte (`docs/cre/phases.md`, `docs/cre/ARCHITECTURE.md`)

## Statusmodell
- `planned`: noch nicht begonnen
- `in_progress`: aktiv in Umsetzung
- `done`: abgeschlossen und validiert
- `blocked`: abhängig von externer Entscheidung/Resource

## Priorisierung
- **P0 (kritisch)**: Architektur-/Sicherheitsgrundlagen, ohne die weitere Arbeit inkonsistent wird
- **P1 (hoch)**: klinisch relevante Kernfunktionalität für produktive CRE-Nutzung
- **P2 (mittel)**: Skalierung, Robustheit, internationale Anschlussfähigkeit
- **P3 (optional/nachgelagert)**: Validierungsausbau, Forschung, Optimierung

## Delivery-Reihenfolge (Waves)

### Wave 1 – Canonical Alignment (P0)
1. E1-01 Canonical CRE Spec (SSOT)
2. E1-02 Ist-vs-Soll Capability Map
3. E1-03 API-/Payload-Konvention vereinheitlichen

### Wave 2 – Safety & Intake Hardening (P1)
4. E2-01 Red-Flag-Matrix finalisieren
5. E2-02 Deterministische Safety-Regeln je Domäne
6. E2-03 10-W/OPQRST als Pflichtstruktur
7. E2-04 Ganzheitliche Anamnese-Blöcke + Completeness Score
8. E2-05 Teach-Back + explizite Negativa

### Wave 3 – Reasoning/Workflow Productization (P1/P2)
9. E3-01 Reasoning-Paket auf Zielmodell heben
10. E3-02 GP-Adapter v1 produktivisieren
11. E3-03 HITL-Gates Ende-zu-Ende erzwingen
12. E3-04 Follow-up-Loop mit Versionskette härten

### Wave 4 – Scale & Validation (P2/P3)
13. E4-01 Mehrsprachigkeit/CSN v1
14. E4-02 FHIR/Export-Abdeckung vervollständigen
15. E4-03 Klinische Validierung Phase I/II aufsetzen
16. E4-04 Drift/Safety-Monitoring als Routine

---

## Epic E1 – Canonical CRE Alignment (P0)

### E1-01 Canonical CRE Spec (SSOT)
- **Priorität**: P0
- **Owner**: Med + Product + Backend
- **Aufwand**: M (3-5 PT)
- **Status**: planned
- **Beschreibung**: Eine verbindliche CRE-Spezifikation erstellen, die alle Kernobjekte, States, Gates und Outputverträge zusammenführt.
- **Akzeptanzkriterien**:
  - Ein Dokument in `docs/cre` definiert verbindlich: Intake, Safety, Reasoning, Follow-up, Sign-off.
  - Für jedes Objekt sind Pflicht-/Optionalfelder dokumentiert.
  - Widersprüche zu bestehenden CRE-Dokumenten sind explizit markiert und entschieden.

### E1-02 Capability Gap Map (Ist vs Soll)
- **Priorität**: P0
- **Owner**: Backend + Studio UI
- **Aufwand**: M (2-4 PT)
- **Status**: planned
- **Beschreibung**: Matrix je Capability (`done`/`partial`/`missing`) mit konkreten Codepfaden und offenen Gaps.
- **Akzeptanzkriterien**:
  - Matrix enthält mindestens: Intake, Safety, Reasoning, Follow-up, HITL, Export, Multilingual, Validation.
  - Jeder Gap hat ein Ticket/Issue mit klarer Verantwortung.
  - Matrix ist in CI/Review auffindbar (Dokulink in CRE-Index).

### E1-03 API Response Konvention harmonisieren
- **Priorität**: P0
- **Owner**: Backend
- **Aufwand**: S-M (2-3 PT)
- **Status**: planned
- **Beschreibung**: Einheitliches API-Schema (`success/data/error`) für CRE-nahe Endpunkte durchsetzen.
- **Akzeptanzkriterien**:
  - CRE-Endpunkte liefern konsistentes Response-Envelope.
  - Fehlercodes sind dokumentiert und wiederverwendbar.
  - Bestehende Verbraucher (Patient/Studio) bleiben kompatibel oder erhalten Migrationshinweis.

---

## Epic E2 – Safety & Intake Hardening (P1)

### E2-01 Red-Flag-Matrix finalisieren (Hard Stop vs Priority Review)
- **Priorität**: P1
- **Owner**: Med Lead + Safety + Backend
- **Aufwand**: M (3-5 PT)
- **Status**: planned
- **Beschreibung**: Verbindliche Matrix für Level A/B/C inkl. Trigger-Definition und Begründung.
- **Akzeptanzkriterien**:
  - Jede Red Flag ist einer Eskalationsstufe zugeordnet.
  - Domänenübergreifende Kernflags (GP-Core) sind vollständig.
  - Matrix ist versioniert und auditierbar.

### E2-02 Deterministische Safety-Regeln je Domäne
- **Priorität**: P1
- **Owner**: Backend
- **Aufwand**: M-L (4-8 PT)
- **Status**: planned
- **Beschreibung**: Regelwerk von GP-Core auf Cardio/Neuro/7S konsistent erweitern, ohne probabilistische Abschwächung.
- **Akzeptanzkriterien**:
  - Rule IDs/Check IDs für jede neue Regel vorhanden.
  - Unit-Tests decken Positiv-, Negativ- und Konfliktfälle ab.
  - Kein Regelpfad kann Hard-Stop durch Reasoning überschreiben.

### E2-03 10-W/OPQRST Pflichtmodul in Intake
- **Priorität**: P1
- **Owner**: Patient UI + Backend
- **Aufwand**: M (3-6 PT)
- **Status**: planned
- **Beschreibung**: Pflichtstruktur für symptombezogene Erhebung als robuste Datenbasis.
- **Akzeptanzkriterien**:
  - 10-W-Felder werden erhoben oder als bewusst nicht beantwortet markiert.
  - OPQRST-Mapping ist im strukturierten Output persistiert.
  - Qualitätsregeln validieren Vollständigkeit und Konsistenz.

### E2-04 Ganzheitliche Anamnese-Module + Completeness Score
- **Priorität**: P1
- **Owner**: Patient UI + Backend
- **Aufwand**: L (6-10 PT)
- **Status**: planned
- **Beschreibung**: PMH/Meds/Allergien/FH/SH/ROS als strukturierte Blöcke mit adaptiver Tiefe.
- **Akzeptanzkriterien**:
  - Evidenz je Abschnitt als `evidence_items` rückverfolgbar.
  - Completeness Score pro Intake verfügbar.
  - Hochrisikofelder erzwingen Pflichtabfrage.

### E2-05 Teach-Back + Explizite Negativa
- **Priorität**: P1
- **Owner**: Patient UI + Backend
- **Aufwand**: S-M (2-4 PT)
- **Status**: planned
- **Beschreibung**: Sicherheitsrelevante Rückbestätigung und aktive Negativabfrage systematisch einführen.
- **Akzeptanzkriterien**:
  - Teach-Back-Block am Ende des Intake-Flows vorhanden.
  - Relevante Negativa werden explizit gespeichert (nicht als fehlend).
  - Safety/Reasoning konsumieren Negativa als Evidenz.

---

## Epic E3 – Reasoning & Workflow Productization (P1/P2)

### E3-01 Reasoning-Paket auf Canvas-Zielmodell
- **Priorität**: P1
- **Owner**: Backend
- **Aufwand**: M (4-7 PT)
- **Status**: planned
- **Beschreibung**: Reasoning-Objekte um Unsicherheit, Safety-Weight und Informationsgewinn konsistent erweitern.
- **Akzeptanzkriterien**:
  - `differentials`, `open_questions`, `recommended_next_steps` entsprechen SSOT-Schema.
  - Unsicherheiten und Widersprüche werden strukturiert ausgegeben.
  - Safety ist strikt vorgelagert und bleibt führend.

### E3-02 GP-Adapter v1 produktivisieren
- **Priorität**: P1
- **Owner**: Med + Backend
- **Aufwand**: M (4-6 PT)
- **Status**: planned
- **Beschreibung**: Adapter-spezifische Priors, Fragesets und konservative Eskalationsschwellen für Allgemeinmedizin.
- **Akzeptanzkriterien**:
  - Adapter-Parameter sind konfigurierbar/versioniert.
  - Unspezifische Leitsymptom-Cluster sind abgedeckt.
  - Output-Template für GP-Kurzanamnese ist verfügbar.

### E3-03 HITL/HIC Gates End-to-End durchsetzen
- **Priorität**: P1
- **Owner**: Backend + Studio UI
- **Aufwand**: M (3-5 PT)
- **Status**: planned
- **Beschreibung**: Draft → Review → Sign-off → Clinical Record als harte Workflow-Logik in API und UI.
- **Akzeptanzkriterien**:
  - Klinische Nutzung/Export nur nach Sign-off möglich.
  - Gate-Entscheidungen sind auditierbar (wer/was/wann/warum).
  - Alle relevanten Endpunkte respektieren Statusrestriktionen.

### E3-04 Follow-up-Loop + Version Chain hardening
- **Priorität**: P2
- **Owner**: Patient UI + Backend
- **Aufwand**: M (3-6 PT)
- **Status**: planned
- **Beschreibung**: Follow-up-Fragen, Antwortverarbeitung und Intake-Versionierung robust und nachvollziehbar machen.
- **Akzeptanzkriterien**:
  - Jede Follow-up-Antwort erzeugt deterministische Versionstransition.
  - `asked_question_ids`/Queue-Logik verhindert Wiederholung.
  - E2E-Tests decken Resume, Skip, Complete ab.

---

## Epic E4 – Scale, Interop, Validation (P2/P3)

### E4-01 Clinical Language Normalization (CSN) v1
- **Priorität**: P2
- **Owner**: NLP + Backend
- **Aufwand**: L (8-12 PT)
- **Status**: planned
- **Beschreibung**: Mehrsprachige Symptomnormalisierung mit Ambiguitätsauflösung und Audit-Provenance.
- **Akzeptanzkriterien**:
  - Sprache pro Turn erkannt und gespeichert.
  - Originalphrase + normalisierte Entität + Ambiguitätsgrad persistiert.
  - Ambiguität über Schwellwert triggert Clarification Prompt.

### E4-02 Export/FHIR Lücken schließen
- **Priorität**: P2
- **Owner**: Backend
- **Aufwand**: M (3-5 PT)
- **Status**: planned
- **Beschreibung**: Intake/Safety/Reasoning/Follow-up konsistent in JSON/PDF/FHIR exportieren.
- **Akzeptanzkriterien**:
  - Export enthält vollständige, sign-off-konforme Datenteile.
  - FHIR-Mapping für zentrale Ressourcen dokumentiert.
  - Zugriffsschutz und Audit für Exporte aktiv.

### E4-03 Klinische Validierung Phase I/II
- **Priorität**: P3
- **Owner**: Med Lead + Research Ops
- **Aufwand**: L (10-20 PT)
- **Status**: planned
- **Beschreibung**: Retrospektive + Shadow-Mode Validierung mit Safety-/Qualitäts-KPIs.
- **Akzeptanzkriterien**:
  - Studienprotokoll, Endpunkte und Goldstandard definiert.
  - KPI-Dashboard für Safety/Qualität/Effizienz vorhanden.
  - Fehleranalyseprozess etabliert.

### E4-04 Drift- & Safety-Monitoring Routine
- **Priorität**: P3
- **Owner**: Backend + Ops
- **Aufwand**: M (4-6 PT)
- **Status**: planned
- **Beschreibung**: Laufendes Monitoring für Rule-Drift, Fehlalarme, Eskalationsmuster.
- **Akzeptanzkriterien**:
  - Regelmäßiger Report (z. B. wöchentlich) verfügbar.
  - Alerting für auffällige FN/FP-Trends definiert.
  - Review-Feedback fließt versioniert in Regelupdates.

---

## Ticket-Backlog (kurz, importierbar)
| ID | Titel | Prio | Aufwand | Owner | Status | Abhängigkeiten |
|---|---|---|---|---|---|---|
| CRE-E1-01 | Canonical CRE Spec (SSOT) | P0 | M | Med+Product+BE | planned | - |
| CRE-E1-02 | Capability Gap Map | P0 | M | BE+Studio | planned | E1-01 |
| CRE-E1-03 | API-Konvention harmonisieren | P0 | S-M | BE | planned | E1-01 |
| CRE-E2-01 | Red-Flag-Matrix finalisieren | P1 | M | Med+Safety+BE | planned | E1-01 |
| CRE-E2-02 | Deterministische Safety-Regeln | P1 | M-L | BE | planned | E2-01 |
| CRE-E2-03 | 10-W/OPQRST Pflichtmodul | P1 | M | Patient UI+BE | planned | E1-01 |
| CRE-E2-04 | Ganzheitliche Anamnese + Score | P1 | L | Patient UI+BE | planned | E2-03 |
| CRE-E2-05 | Teach-Back + Negativa | P1 | S-M | Patient UI+BE | planned | E2-03 |
| CRE-E3-01 | Reasoning auf Zielmodell | P1 | M | BE | planned | E1-01,E2-02 |
| CRE-E3-02 | GP-Adapter v1 | P1 | M | Med+BE | planned | E3-01 |
| CRE-E3-03 | HITL/HIC Gates E2E | P1 | M | BE+Studio | planned | E1-03 |
| CRE-E3-04 | Follow-up Loop hardening | P2 | M | Patient UI+BE | planned | E3-01 |
| CRE-E4-01 | CSN v1 | P2 | L | NLP+BE | planned | E1-01 |
| CRE-E4-02 | Export/FHIR schließen | P2 | M | BE | planned | E3-03 |
| CRE-E4-03 | Klinische Validierung I/II | P3 | L | Med+Research | planned | E2-01,E3-03 |
| CRE-E4-04 | Drift/Safety Monitoring | P3 | M | BE+Ops | planned | E2-02 |

## DoD (global)
Ein Ticket gilt nur dann als `done`, wenn:
1. Akzeptanzkriterien vollständig erfüllt sind.
2. Unit-/Integration-/E2E-Tests (wo zutreffend) grün sind.
3. Audit-/Sicherheitsanforderungen dokumentiert wurden.
4. Betroffene CRE-Dokumentation in `docs/cre` aktualisiert ist.

## Nächste operative Entscheidung
Für den Start der Umsetzung wird empfohlen, **Wave 1 vollständig** in einem Sprint abzuschließen, bevor zusätzliche Feature-Arbeit an Safety/Reasoning beginnt.