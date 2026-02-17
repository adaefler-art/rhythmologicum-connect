# CRE Kommende Version — Epics & Issues (Stand 2026-02-15)

Quelle:
- `docs/cre/ROADMAP_POST_E4_2026-02-15.md`
- `docs/cre/USE_CASE_REFERENCE_2026-02-17.md`
- `docs/cre/ROLLOUT_USE_CASE_PLAN_2026-02-17.md`

Zweck:
- Ein einziges Planungsdokument für die **kommende Version** (post-E4).
- Enthält alle geplanten Epics und umsetzbare Issues inkl. Priorität, Status, Abhängigkeiten und Exit-Kriterien.

## Statusmodell
- `planned`: noch nicht begonnen
- `in_progress`: aktiv in Umsetzung
- `review`: in fachlicher/technischer Abnahme
- `done`: abgeschlossen
- `blocked`: extern blockiert

---

## Epic-Übersicht (kommende Version)

| Epic | Titel | Zeitraum | Priorität | Status | Ziel |
|---|---|---|---|---|---|
| CRE-NV1 | Test Härtung & Golden Set | Woche 1-2 | P0 | planned | Regressionen minimieren, Safety stabilisieren |
| CRE-NV2 | Patient UX/UI Testready | Woche 1-2 (parallel) | P0 | planned | Patient-Dialog vollständig testbar und release-fähig |
| CRE-NV3 | Controlled Pilot / Shadow Mode | Woche 3-5 | P1 | planned | KPI-stabiler Betrieb unter realen Bedingungen |
| CRE-NV4 | Workflow & UX Refinement | Woche 6-8 | P1 | planned | Qualität der Dialogführung und Review-Effizienz erhöhen |
| CRE-NV5 | Readiness Gate & Release | Woche 9-10 | P0 | planned | Go/No-Go Entscheidung und abgesicherter Rollout |

### Use-Case Mapping (Rollout-Fokus)

| Use Case | Primäre Epics | Kurzfokus |
|---|---|---|
| UC1 Pre-Visit Structured Capture | CRE-NV1, CRE-NV2, CRE-NV5 | Stabiler Pause/Resume + deterministischer Abschluss ohne Diagnoseausgabe |
| UC2 Waiting Room Fastpass | CRE-NV2, CRE-NV3, CRE-NV5 | 5-Minuten-Mindestdatensatz, unvollständiger Intake mit Open Loops |
| UC3 Consult Mode Silent Listener | CRE-NV3, CRE-NV4, CRE-NV5 | Arztgeführtes Panel mit Captured/Missing/Unclear + Evidenzquellen |

### Use-Case Scope Guardrails (verbindlich)

- Kein patient-facing Clinical Reasoning.
- Keine Ranking-/Wahrscheinlichkeits-/Risikologik.
- Keine Diagnose-/Therapie-/Diagnostikempfehlung.
- Keine patientenspezifische Interpretation.

---

## Alle Issues (kommende Version, vollständig)

| ID | Epic | Titel | Prio | Aufwand | Status | Abhängigkeiten |
|---|---|---|---|---|---|---|
| CRE-NV1-01 | CRE-NV1 | Golden-Set v1 definieren (30-50 Fälle) | P0 | M | planned | - |
| CRE-NV1-02 | CRE-NV1 | Golden-Set E2E Runner (batch + report) | P0 | M | planned | CRE-NV1-01 |
| CRE-NV1-03 | CRE-NV1 | Defect-Triage-Template + Root-Cause-Tags | P1 | S | planned | CRE-NV1-01 |
| CRE-NV1-04 | CRE-NV1 | Follow-up Repeat-Fragen Regression-Tests | P0 | S-M | planned | CRE-NV1-02 |
| CRE-NV2-01 | CRE-NV2 | UX-State-Katalog finalisieren (Initial/Success/Error/Hard-Stop) | P0 | S | planned | - |
| CRE-NV2-02 | CRE-NV2 | Patient-Microcopy für Kernübergänge vereinheitlichen | P0 | S-M | planned | CRE-NV2-01 |
| CRE-NV2-03 | CRE-NV2 | Stabile E2E-Selektoren im Dialog ergänzen | P0 | S-M | planned | CRE-NV2-01 |
| CRE-NV2-04 | CRE-NV2 | Retry/Back/Reload deterministisch absichern | P0 | M | planned | CRE-NV2-03 |
| CRE-NV2-05 | CRE-NV2 | Mobile Readiness Check (Viewport/Scroll/Keyboard) | P1 | S-M | planned | CRE-NV2-04 |
| CRE-NV3-01 | CRE-NV3 | Shadow-Mode Betrieb mit Fallvolumen starten | P1 | M | planned | CRE-NV1-02, CRE-NV2-04 |
| CRE-NV3-02 | CRE-NV3 | KPI-Thresholds kalibrieren (`/api/admin/kpi-thresholds`) | P1 | M | planned | CRE-NV3-01 |
| CRE-NV3-03 | CRE-NV3 | Monitoring-Review Routine etablieren (`/api/admin/metrics/cre-monitoring`) | P1 | S-M | planned | CRE-NV3-01 |
| CRE-NV4-01 | CRE-NV4 | Gesprächsleitfaden v2 für PAT umsetzen | P1 | M | planned | CRE-NV2-02, CRE-NV3-01 |
| CRE-NV4-02 | CRE-NV4 | Follow-up Orchestrierung v2 (Anti-Repeat + Kontext) | P1 | M | planned | CRE-NV1-04, CRE-NV3-01 |
| CRE-NV4-03 | CRE-NV4 | Follow-up State-Machine + Answer-Klassifikation (systemisch) | P0 | M-L | planned | CRE-NV1-04, CRE-NV2-04, CRE-NV3-01 |
| CRE-NV4-04 | CRE-NV4 | Clinician Review UX Beschleunigung | P1 | M | planned | CRE-NV3-01 |
| CRE-NV4-05 | CRE-NV4 | Objective/Slot-Modell für Anamnese-Steuerung einführen | P0 | L | planned | CRE-NV4-03 |
| CRE-NV5-01 | CRE-NV5 | Release-Readiness Report erstellen | P0 | S-M | planned | CRE-NV3-02, CRE-NV4-02 |
| CRE-NV5-02 | CRE-NV5 | Go/No-Go Gate mit dokumentiertem Risikoentscheid | P0 | S | planned | CRE-NV5-01 |
| CRE-NV5-03 | CRE-NV5 | Staged Rollout + Rollback Playbook finalisieren | P0 | S-M | planned | CRE-NV5-02 |

---

## Add-on Issues (Use-Case Gaps, neu ab 2026-02-17)

| ID | Use Case | Titel | Prio | Aufwand | Status | Abhängigkeiten |
|---|---|---|---|---|---|---|
| CRE-UC1-01 | UC1 | Abschluss-/Übermittlungs-Flow im Patient Dialog (explizit) | P0 | M | planned | CRE-NV2-02, CRE-NV2-04 |
| CRE-UC1-02 | UC1 | Pause/Resume als SSOT mit klarer Fortschrittsposition | P0 | M | planned | CRE-NV2-04 |
| CRE-UC1-03 | UC1 | Open-Loop Qualitätsregeln + Vollständigkeitscheck pro Objective härten | P1 | M | planned | CRE-NV4-03, CRE-NV4-05 |
| CRE-UC2-01 | UC2 | Fastpass Form-first UI (Tablet/Kiosk, no-audio, Tap-first) | P0 | M | planned | CRE-NV2-05 |
| CRE-UC2-02 | UC2 | Minimum-Dataset Contract + Validierung | P0 | S-M | planned | CRE-UC2-01 |
| CRE-UC2-03 | UC2 | UC2→UC1 Übergabe via QR/Deep-Link (optional) | P1 | S-M | planned | CRE-UC2-01, CRE-UC1-02 |
| CRE-UC3-01 | UC3 | Consent/Recording-Status + Audit Events für Consult Mode | P0 | M | planned | CRE-NV3-03 |
| CRE-UC3-02 | UC3 | Silent-Listener Clinician-Panel (nur Captured/Missing/Unclear) | P0 | M | planned | CRE-NV4-04, CRE-UC3-01 |
| CRE-UC3-03 | UC3 | Evidenz-/Timestamp-Attribution im Intake (`source=conversation`) | P1 | M | planned | CRE-UC3-02 |
| CRE-UC3-04 | UC3 | Physician-directed Clarification Suggestions (formal-strukturell) | P1 | M | planned | CRE-UC3-02 |
| CRE-UC3-05 | UC3 | Scope-Gate im Consult Mode (keine Hypothesen/Diagnosen/Wahrscheinlichkeiten) | P0 | S-M | planned | CRE-UC3-02 |
| CRE-UC-GR-01 | UC1/2/3 | Prompt-/Copy-Linter gegen diagnostische Sprache | P0 | S-M | planned | CRE-NV2-02 |
| CRE-UC-GR-02 | UC1/2/3 | Output-Contracts ohne Ranking/Wahrscheinlichkeit/Risk/Triage härten | P0 | M | planned | CRE-NV4-03 |
| CRE-UC-GR-03 | UC1/2/3 | Regressionstests für verbotene Aussagen (Patient + Clinician) | P0 | M | planned | CRE-UC-GR-01, CRE-UC-GR-02 |
| CRE-UC-GR-04 | UC1/2/3 | Review-Gate: Scope-Verstoß blockiert Merge/Release | P0 | S | planned | CRE-UC-GR-03, CRE-NV5-02 |
| CRE-ROLL-01 | UC1/2/3 | KPI-/Go-No-Go-Matrix pro Use Case | P0 | S-M | planned | CRE-NV5-01 |
| CRE-ROLL-02 | UC1/2/3 | Schulungs-/Betriebsrunbook pro Touchpoint | P1 | S-M | planned | CRE-NV5-03 |

---

## Epic-Details & Exit-Kriterien

### CRE-NV1 — Test Härtung & Golden Set
- **Exit-Kriterien**:
  - `golden_set_pass_rate >= 0.95`
  - `critical_defects_open = 0`
  - Kritische Defects haben Fix + Regression-Test

### CRE-NV2 — Patient UX/UI Testready
- **Exit-Kriterien**:
  - 100% definierte UX-States in manuellen Testfällen abgedeckt
  - 0 offene P0/P1 UI-Bugs im Patient-Dialog
  - E2E-Smoke Kernpfad in 3 konsekutiven Läufen stabil
  - Kein kritischer Copy-Bruch in Kernübergängen

### CRE-NV3 — Controlled Pilot / Shadow Mode
- **Exit-Kriterien**:
  - KPI-Stabilität über 2 Wochen
  - Kein unadressierter `critical` Alert
  - Klinisches Review bestätigt Alltagstauglichkeit

### CRE-NV4 — Workflow & UX Refinement
- **Exit-Kriterien**:
  - Wiederholfragen um >= 50% ggü. Wave-5-Baseline reduziert
  - `clarification_loop_rate` sinkt signifikant ggü. Wave-5-Baseline
  - `resolved_followup_rate` stabil im Zielkorridor
  - `objective_reask_violation_count = 0` im Golden-Set
  - slot-basierte Steuerung (`objective_id`) in Follow-up-Planung aktiv
  - `patient_dialog_dropoff_rate` verbessert ggü. Wave-6-Baseline
  - Positive qualitative UX-Rückmeldung klinisch dokumentiert

### CRE-NV5 — Readiness Gate & Release
- **Exit-Kriterien**:
  - Keine offenen Safety-Kritiker
  - KPI-Schwellen über 2 Wochen gehalten
  - Export-/Audit-Compliance vollständig
  - Monitoring + Alerting operativ bestätigt

---

## KPI-Set für die kommende Version
- `golden_set_pass_rate`
- `critical_defects_open`
- `followup_repeat_question_rate`
- `clarification_loop_rate`
- `resolved_followup_rate`
- `objective_slot_closure_rate`
- `objective_reask_violation_count`
- `followup_goal_coverage_rate`
- `patient_dialog_success_rate`
- `patient_dialog_dropoff_rate`
- `patient_ui_blocker_open`
- `cre_followup_yield`
- `cre_upload_completion_rate`
- `cre_review_approval_rate`
- `cre_hard_stop_rate`

## Reihenfolge (empfohlen)
1. CRE-NV1-01 bis CRE-NV1-04
2. CRE-NV2-01 bis CRE-NV2-05 (parallel zu NV1)
3. CRE-NV3-01 bis CRE-NV3-03
4. CRE-NV4-01 bis CRE-NV4-04
5. CRE-NV5-01 bis CRE-NV5-03

## Operatives Tracking
- Abarbeitungs-Checkliste: `V0_8_EXECUTION_CHECKLIST_2026-02-15.md`
