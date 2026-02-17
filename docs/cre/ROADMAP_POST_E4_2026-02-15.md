# CRE Roadmap Post-E4 (Stand 2026-02-15)

## Ausgangslage
E1 bis E4 sind implementiert und in `main` integriert. Fokus der nächsten Iteration ist **Produktreife unter realer Last** statt neuer Breitenfeatures.

Leitprinzipien:
- Safety vor Feature-Speed
- Messbarkeit vor Annahmen
- Kleine, reversible Releases

## Update 2026-02-17 — Rollout use-case first (revised reference)

Die operative Priorisierung läuft ab jetzt über drei Use-Cases:
- **UC1** Pre-Visit Structured Capture (Home, asynchron)
- **UC2** Waiting Room Fastpass (Tablet/Kiosk, minimal)
- **UC3** Consult Mode Silent Listener (arztgeführt, Audio-first)

Verbindliche Referenz für Scope, Sprache, Output und Guardrails:
- `docs/cre/USE_CASE_REFERENCE_2026-02-17.md`

Operationaler Umsetzungsplan (Gap-Analyse, Arbeitspakete, Sequenzierung):
- `docs/cre/ROLLOUT_USE_CASE_PLAN_2026-02-17.md`

Die bestehende Wave-Struktur bleibt als Delivery-Rahmen erhalten und wird wie folgt zugeordnet:
- **Wave 5-6**: UC1 Stabilisierung + Qualitätsgates
- **Wave 6-7**: UC2 Fastpass + Minimum Dataset
- **Wave 7-8**: UC3 Silent Listener + Readiness

Nicht verhandelbare Scope-Regeln (alle Waves, alle Use-Cases):
- Kein patient-facing Clinical Reasoning
- Keine Ranking-/Wahrscheinlichkeits-/Risikologik
- Keine Diagnose-/Therapie-/Diagnostikempfehlung
- Keine patientenspezifische Interpretation

## Ziele der nächsten 10 Wochen
1. **Stabilität im Realbetrieb**: Follow-up/CSN/Review-Flow ohne Regressionen.
2. **Klinische Nachvollziehbarkeit**: Export- und Auditpfade konsistent verifiziert.
3. **Operational Excellence**: Monitoring-Alerts und KPI-Gates als echtes Release-Kriterium.
4. **Evidenzbasierte Priorisierung**: Entscheidungen aus Golden-Set + Shadow-Mode Daten.

---

## Wave 5 (Woche 1-2) — Test Härtung & Golden Set

### Deliverables
- Golden-Set v1 (30-50 de-identifizierte Fälle) mit erwarteten Outputs:
  - CSN Mapping + Ambiguität
  - Follow-up Sequenz/Stop-Kriterien
  - Review/Sign-off Verhalten
  - JSON/FHIR Export Checks
- Automatisierter E2E-Test-Runner für Golden-Set (batch + report).
- Defect-Triage-Template (Root Cause Tags: rule/prompt/mapping/data/ui).

### Exit-Kriterien
- >= 95% Golden-Set Pass-Rate
- 0 kritische Safety-Fehler offen
- Alle kritischen Defects mit Fix + Regression-Test

### KPIs
- `golden_set_pass_rate`
- `critical_defects_open`
- `followup_repeat_question_rate`

### Parallel-Track: Patient UX/UI Testready (Woche 1-2)

### Deliverables
- Definierter UX-State-Katalog für den Patient-Dialog:
  - Initial/Loading
  - Success/Next Question
  - Validation Error
  - Network/Server Error
  - Hard-Stop/Safety Escalation
- Konsistente, patientengerechte Microcopy für kritische Übergänge:
  - Rückfragen nach Upload
  - Unklare Antwort/Präzisierungsbedarf
  - Abschluss + nächste Schritte
- Testbarkeit in UI:
  - stabile Selektoren für E2E-Flows
  - deterministisches Verhalten bei Retry/Back/Reload
- Mobile Readiness Check für relevante Viewports inkl. Scroll/Keyboard-Verhalten.

### Exit-Kriterien
- 100% Abdeckung der definierten UX-States in manuellen Testfällen
- 0 offene P0/P1 UI-Bugs im Patient-Dialog
- E2E-Smoketests für Kernpfad stabil in 3 konsekutiven Läufen
- Kein kritischer Copy-Bruch in den Kernübergängen

### KPIs
- `patient_dialog_success_rate`
- `patient_dialog_dropoff_rate`
- `patient_ui_blocker_open`

---

## Wave 6 (Woche 3-5) — Controlled Pilot / Shadow Mode

### Deliverables
- Shadow-Mode-Betrieb mit definiertem Fallvolumen und Review-Fenster.
- Wöchentliches CRE Monitoring Review (`/api/admin/metrics/cre-monitoring`).
- KPI-Thresholds in Admin final kalibriert (`/api/admin/kpi-thresholds`).

### Exit-Kriterien
- KPI-Stabilität über 2 aufeinanderfolgende Wochen
- Kein unadressierter `critical` Alert
- Klinisches Review bestätigt Nutzbarkeit für Alltagsszenarien

### KPIs (Zielkorridor)
- `cre_followup_yield >= 0.60`
- `cre_upload_completion_rate >= 0.50`
- `cre_review_approval_rate >= 0.50`
- `cre_hard_stop_rate` stabil (ohne plötzliche Drift)

---

## Wave 7 (Woche 6-8) — Workflow & UX Refinement

### Deliverables
- Gesprächsleitfaden v2 für PAT (natürlich, professionell, anamnesefokussiert).
- Follow-up Orchestrierung v2:
  - harte Anti-Repeat-Regeln
  - bessere Kontextweitergabe bei `clinician_request`
  - Objective/Slot-Modell als führender Steuerungskern (fehlend/beantwortet/verifiziert/blocked_by_safety)
  - slot-basierte Frageplanung statt textbasierter Re-Ask-Entscheidungen
- Clinician UX Verbesserungen:
  - schnellere Review-Entscheidung
  - klarere Evidenzpfade

### Exit-Kriterien
- Reduktion der Wiederholfragen um >= 50% ggü. Wave-5-Baseline
- 0 Re-Ask auf bereits geschlossene Objective-Slots im Golden-Set
- Follow-up-Planung ist über stabile `objective_id` nachvollziehbar (nicht über Fragetext)
- Positive klinische UX-Rückmeldung (qualitatives Review)
- `patient_dialog_dropoff_rate` verbessert ggü. Wave-6-Baseline

### Zusätzliche KPIs (Wave 7)
- `objective_slot_closure_rate`
- `objective_reask_violation_count`
- `followup_goal_coverage_rate`

---

## Wave 8 (Woche 9-10) — Readiness Gate & Release

### Deliverables
- Release-Readiness Report (Safety, Qualität, Performance, Ops).
- Go/No-Go Entscheidung mit dokumentierten Risiken.
- Rollout-Plan mit Guardrails (staged rollout + rollback playbook).

### Go/No-Go Kriterien
- Keine offenen Safety-Kritiker
- KPI-Schwellen in 2 Wochen gehalten
- Export-/Audit-Compliance vollständig
- Monitoring + Alerting operativ bestätigt

---

## Priorisierter Backlog nach E4

### P0 (sofort)
- Golden-Set Runner + Report
- Follow-up Anti-Repeat Feintuning
- CSN Mapping-Korrekturen aus realen Fällen

### P1 (kurzfristig)
- PAT Gesprächsleitfaden v2
- Clinician Review UX Beschleunigung
- Alert-Runbook Operationalisierung

### P2 (nachgelagert)
- Erweiterte Multilingualität (IT/FR/ES)
- FHIR Profile-Härtung (über FHIR-like hinaus)
- Erweiterte Forschungsmetriken

---

## Risiken & Gegenmaßnahmen

- **Risiko: Überfitting auf Golden-Set**  
  Gegenmaßnahme: Rotierendes Holdout-Set + Shadow-Mode-Kontrolle.

- **Risiko: Alert-Fatigue im Monitoring**  
  Gegenmaßnahme: klare Threshold-Tuning-Routine + Priorisierung `critical` zuerst.

- **Risiko: UX-Regressions bei Prompt-Anpassungen**  
  Gegenmaßnahme: Prompt-Änderungen nur mit A/B-Fallvergleich und Rollback-Plan.

- **Risiko: Export-Komplexität wächst schneller als Testabdeckung**  
  Gegenmaßnahme: Contract-Tests für JSON/FHIR Pflicht vor jeder Release-Freigabe.

---

## Operativer Rhythmus
- **Täglich**: Defect-Triage (15 min)
- **Wöchentlich**: CRE Monitoring Review (60 min)
- **Zweiwöchentlich**: Med+BE+Product Decision Gate
- **Am Ende jeder Wave**: formales Exit-Review mit dokumentiertem Ergebnis

## Umsetzungsdokument
- Detaillierte Epic/Issue-Liste für die kommende Version: `EPICS_AND_ISSUES_NEXT_VERSION_2026-02-15.md`
