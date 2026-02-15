# CRE Issues Tracker (Abarbeitbar)

Stand: 2026-02-15  
Quelle: `docs/cre/IMPLEMENTATION_BACKLOG_2026-02-15.md`

## Nutzung
- Dieses Dokument ist die operative Arbeitsliste für die Umsetzung.
- Statuswerte: `todo` | `in_progress` | `review` | `done` | `blocked`
- Ein Issue darf erst auf `done`, wenn alle Akzeptanzkriterien erfüllt sind.

## Reihenfolge (verbindlich)
1. CRE-E1-01
2. CRE-E1-02
3. CRE-E1-03
4. CRE-E2-01
5. CRE-E2-02
6. CRE-E2-03
7. CRE-E2-04
8. CRE-E2-05
9. CRE-E3-01
10. CRE-E3-02
11. CRE-E3-03
12. CRE-E3-04
13. CRE-E4-01
14. CRE-E4-02
15. CRE-E4-03
16. CRE-E4-04

---

## Issue-Liste (kompakt)

| ID | Titel | Prio | Aufwand | Status | Abhängigkeiten |
|---|---|---|---|---|---|
| CRE-E1-01 | Canonical CRE Spec (SSOT) | P0 | M | done | - |
| CRE-E1-02 | Capability Gap Map (Ist vs Soll) | P0 | M | done | CRE-E1-01 |
| CRE-E1-03 | API-Konvention harmonisieren | P0 | S-M | done | CRE-E1-01 |
| CRE-E2-01 | Red-Flag-Matrix finalisieren | P1 | M | done | CRE-E1-01 |
| CRE-E2-02 | Deterministische Safety-Regeln je Domäne | P1 | M-L | done | CRE-E2-01 |
| CRE-E2-03 | 10-W/OPQRST Pflichtmodul | P1 | M | done | CRE-E1-01 |
| CRE-E2-04 | Ganzheitliche Anamnese + Completeness Score | P1 | L | done | CRE-E2-03 |
| CRE-E2-05 | Teach-Back + Explizite Negativa | P1 | S-M | done | CRE-E2-03 |
| CRE-E3-01 | Reasoning-Paket auf Zielmodell | P1 | M | done | CRE-E1-01, CRE-E2-02 |
| CRE-E3-02 | GP-Adapter v1 produktivisieren | P1 | M | done | CRE-E3-01 |
| CRE-E3-03 | HITL/HIC Gates End-to-End | P1 | M | done | CRE-E1-03 |
| CRE-E3-04 | Follow-up-Loop + Version Chain hardening | P2 | M | done | CRE-E3-01 |
| CRE-E4-01 | Clinical Language Normalization (CSN) v1 | P2 | L | todo | CRE-E1-01 |
| CRE-E4-02 | Export/FHIR-Lücken schließen | P2 | M | todo | CRE-E3-03 |
| CRE-E4-03 | Klinische Validierung Phase I/II | P3 | L | todo | CRE-E2-01, CRE-E3-03 |
| CRE-E4-04 | Drift- & Safety-Monitoring Routine | P3 | M | todo | CRE-E2-02 |

---

## Detaillierte Issues (abarbeitbar)

### [x] CRE-E1-01 — Canonical CRE Spec (SSOT)
- **Status**: done
- **Owner**: Med + Product + Backend
- **Ziel**: Eine verbindliche CRE-Spezifikation für Intake, Safety, Reasoning, Follow-up und Sign-off.
- **Tasks**:
  - [x] Zielschema definieren (Pflicht/Optionalfelder)
  - [x] State-Machine + Gates finalisieren
  - [x] Konflikte zu bestehender Doku entscheiden
  - [x] Dokument in `docs/cre` veröffentlichen
- **Akzeptanzkriterien**:
  - [x] SSOT-Dokument vorhanden
  - [x] Alle Kernobjekte eindeutig spezifiziert
  - [x] Widersprüche zur Alt-Doku aufgelöst

### [x] CRE-E1-02 — Capability Gap Map (Ist vs Soll)
- **Status**: done
- **Owner**: Backend + Studio UI
- **Ziel**: Transparente Matrix je Capability (`done/partial/missing`) mit konkreten Gaps.
- **Tasks**:
  - [x] Capability-Liste fixieren
  - [x] Codepfade je Capability referenzieren
  - [x] Gaps in Tickets überführen
- **Akzeptanzkriterien**:
  - [x] Matrix enthält Intake, Safety, Reasoning, Follow-up, HITL, Export, Multilingual, Validation
  - [x] Jeder `missing/partial` Punkt hat ein Folge-Issue

### [x] CRE-E1-03 — API-Konvention harmonisieren
- **Status**: done
- **Owner**: Backend
- **Ziel**: Einheitliches Response-Envelope für CRE-Endpunkte.
- **Tasks**:
  - [x] Endpunkt-Inventar erstellen
  - [x] Schema `success/data/error` überall anwenden
  - [x] Fehlercodes dokumentieren
- **Akzeptanzkriterien**:
  - [x] CRE-Endpunkte liefern konsistentes Envelope
  - [x] Kompatibilität mit bestehenden Clients sichergestellt

### [x] CRE-E2-01 — Red-Flag-Matrix finalisieren
- **Status**: done
- **Owner**: Med Lead + Safety + Backend
- **Ziel**: Verbindliche A/B/C-Eskalationsmatrix je Flag.
- **Tasks**:
  - [x] GP-Core-Red-Flags konsolidieren
  - [x] Hard Stop vs Priority Review definieren
  - [x] Versionierung + Audit-Referenzen ergänzen
- **Akzeptanzkriterien**:
  - [x] Jede Red Flag hat genau eine Eskalationsstufe
  - [x] Matrix ist versioniert und dokumentiert

### [x] CRE-E2-02 — Deterministische Safety-Regeln je Domäne
- **Status**: done
- **Owner**: Backend
- **Ziel**: Ausbau des regelbasierten Safety-Layers ohne probabilistische Entschärfung.
- **Tasks**:
  - [x] Regelsets GP/Core/Cardio/Neuro/7S ergänzen
  - [x] Rule IDs + Check IDs erweitern
  - [x] Unit-Tests für Positiv/Negativ/Konflikte
- **Akzeptanzkriterien**:
  - [x] Neue Regeln testabgedeckt
  - [x] Safety kann nicht durch Reasoning überschrieben werden

### [x] CRE-E2-03 — 10-W/OPQRST Pflichtmodul
- **Status**: done
- **Owner**: Patient UI + Backend
- **Ziel**: Standardisierte symptombezogene Erhebung als Pflichtstruktur.
- **Tasks**:
  - [x] 10-W-Felder erzwingen oder bewusst als unbeantwortet markieren
  - [x] OPQRST-Mapping persistieren
  - [x] Quality-Validierung erweitern
- **Akzeptanzkriterien**:
  - [x] 10-W strukturiert im Intake vorhanden
  - [x] OPQRST konsistent im Output

### [x] CRE-E2-04 — Ganzheitliche Anamnese + Completeness Score
- **Status**: done
- **Owner**: Patient UI + Backend
- **Ziel**: PMH/Meds/Allergien/FH/SH/ROS vollständig strukturieren.
- **Tasks**:
  - [x] Module für Hintergrundanamnese ergänzen
  - [x] `evidence_items`-Provenance je Abschnitt absichern
  - [x] Completeness Score berechnen und speichern
- **Akzeptanzkriterien**:
  - [x] Strukturierte Blöcke inkl. Provenance vorhanden
  - [x] Completeness Score im Paket verfügbar

### [x] CRE-E2-05 — Teach-Back + Explizite Negativa
- **Status**: done
- **Owner**: Patient UI + Backend
- **Ziel**: Sicherheitsrelevante Rückbestätigung und Negativa systematisch erfassen.
- **Tasks**:
  - [x] Teach-Back-Block am Intake-Ende integrieren
  - [x] Negativa explizit speichern
  - [x] Konsum in Safety/Reasoning sicherstellen
- **Akzeptanzkriterien**:
  - [x] Teach-Back im Workflow sichtbar
  - [x] Negativa als Evidenz (nicht fehlend) vorhanden

### [x] CRE-E3-01 — Reasoning-Paket auf Zielmodell
- **Status**: done
- **Owner**: Backend
- **Ziel**: Reasoning strukturell auf Canvas-Zielmodell bringen.
- **Tasks**:
  - [x] Differentials/Open Questions/Next Steps angleichen
  - [x] Unsicherheiten + Widersprüche formal ausgeben
  - [x] Safety-Priorität technisch absichern
- **Akzeptanzkriterien**:
  - [x] Output entspricht SSOT-Schema
  - [x] Konflikte/Unsicherheiten maschinenlesbar vorhanden

### [x] CRE-E3-02 — GP-Adapter v1 produktivisieren
- **Status**: done
- **Owner**: Med + Backend
- **Ziel**: Adapter für Allgemeinmedizin mit konservativer Safety-Strategie.
- **Tasks**:
  - [x] Priors/Fragebibliothek definieren
  - [x] Schwellenwerte für Eskalation konfigurieren
  - [x] GP-Kurzanamnese-Template bereitstellen
- **Akzeptanzkriterien**:
  - [x] Adapter-Parameter versioniert
  - [x] GP-Leitsymptomcluster abgedeckt

### [x] CRE-E3-03 — HITL/HIC Gates End-to-End
- **Status**: done
- **Owner**: Backend + Studio UI
- **Ziel**: Draft → Review → Sign-off als harte Workflow-Regel.
- **Tasks**:
  - [x] Statusübergänge in APIs erzwingen
  - [x] UI-Gates inkl. Berechtigungsprüfung integrieren
  - [x] Audit-Logs für Gate-Entscheidungen ergänzen
- **Akzeptanzkriterien**:
  - [x] Export/klinische Nutzung nur nach Sign-off
  - [x] Gate-Events vollständig auditierbar

### [x] CRE-E3-04 — Follow-up-Loop + Version Chain hardening
- **Status**: done
- **Owner**: Patient UI + Backend
- **Ziel**: Deterministischer Follow-up-Lebenszyklus mit robuster Versionierung.
- **Tasks**:
  - [x] Queue-/Asked-ID-Logik härten
  - [x] Resume/Skip/Complete sauber modellieren
  - [x] E2E-Abdeckung erweitern
- **Akzeptanzkriterien**:
  - [x] Keine Wiederholfragen bei beantworteten IDs
  - [x] Versionstransitionen nachvollziehbar und testbar

### [ ] CRE-E4-01 — Clinical Language Normalization (CSN) v1
- **Status**: todo
- **Owner**: NLP + Backend
- **Ziel**: Mehrsprachige Semantiknormalisierung mit Ambiguitätsmanagement.
- **Tasks**:
  - [ ] Language Detection pro Turn
  - [ ] Phrase→Entity Mapping
  - [ ] Clarification bei Ambiguität > Schwellwert
- **Akzeptanzkriterien**:
  - [ ] Originalphrase + normalisierte Entität + Ambiguität gespeichert
  - [ ] Rückfragenstrategie operationalisiert

### [ ] CRE-E4-02 — Export/FHIR-Lücken schließen
- **Status**: todo
- **Owner**: Backend
- **Ziel**: Konsistente Ausleitung von Intake/Safety/Reasoning/Follow-up.
- **Tasks**:
  - [ ] JSON/PDF/FHIR Feldabdeckung vervollständigen
  - [ ] RBAC + Audit bei Exporten prüfen
  - [ ] Mapping-Doku aktualisieren
- **Akzeptanzkriterien**:
  - [ ] Exporte vollständig und sign-off-konform
  - [ ] FHIR-Mapping dokumentiert

### [ ] CRE-E4-03 — Klinische Validierung Phase I/II
- **Status**: todo
- **Owner**: Med Lead + Research Ops
- **Ziel**: Safety/Nutzen klinisch belastbar evaluieren.
- **Tasks**:
  - [ ] Studienprotokoll definieren (retrospektiv + shadow mode)
  - [ ] KPI-Schwellen festlegen
  - [ ] Auswertungs- und Fehleranalyseprozess einführen
- **Akzeptanzkriterien**:
  - [ ] Protokoll freigegeben
  - [ ] KPI-Reporting lauffähig

### [ ] CRE-E4-04 — Drift- & Safety-Monitoring Routine
- **Status**: todo
- **Owner**: Backend + Ops
- **Ziel**: Kontinuierliche Überwachung von Fehlalarm- und Risiko-Trends.
- **Tasks**:
  - [ ] Monitoring-KPIs definieren
  - [ ] Regelmäßige Reports/Alerts aufsetzen
  - [ ] Feedback-Loop in Regelversionierung integrieren
- **Akzeptanzkriterien**:
  - [ ] Regelmäßiger Monitoring-Report vorhanden
  - [ ] Alerting für kritische Trends aktiv

---

## Arbeitsregel für die Abarbeitung durch Copilot
Bei jedem Issue in dieser Datei erfolgt die Umsetzung in dieser Reihenfolge:
1. Ist-Analyse im Code
2. minimal-invasive Implementierung
3. Tests/Lint/Build (soweit sinnvoll)
4. Doku-Update
5. Statuswechsel (`todo` → `in_progress` → `review` → `done`)

## Startempfehlung
- **Jetzt starten mit**: `CRE-E1-01`