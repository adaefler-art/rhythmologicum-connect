# CRE NV1 Defect Triage Template + Root-Cause Tags

Stand: 2026-02-15  
Geltungsbereich: CRE-NV1 Golden-Set und Follow-up/Dialog Regressionen

## Zweck

Dieses Template standardisiert die tägliche Defect-Triage für NV1.
Ziele:
- schnelle Priorisierung von klinisch/release-relevanten Defects
- einheitliche Root-Cause-Klassifikation
- direkte Verknüpfung mit Fix, Regressionstest und Golden-Set-Fall

## Triage-Frequenz

- Daily 15 Minuten (Pflicht, siehe v0.8 Execution Checklist)
- Zusätzlicher Ad-hoc Run nach jedem P0/P1 Incident

## Severity-Definition

- `P0` — Safety/Compliance kritisch, Release-Blocker
- `P1` — klinisch oder UX-kritisch im Kernpfad, muss vor Exit-Check geschlossen sein
- `P2` — relevant, aber kein unmittelbarer Exit-Blocker
- `P3` — Nice-to-have / Nachlauf

## Root-Cause-Tags (Pflichtfeld)

- `classification_logic` — Fehlklassifikation von Antworten (`answered|partial|unclear|contradiction`)
- `followup_orchestration` — falsche Step-/Objective-Navigation, Queue-/State-Fehler
- `objective_slot_mapping` — objective_id/slot Zuordnung inkonsistent
- `duplicate_question_guard` — Re-Ask-/Echo-Filter unvollständig oder fehlerhaft
- `prompt_contract` — Prompt/Output-Vertrag liefert unklare oder widersprüchliche Struktur
- `api_response_contract` — API-Format/Schema verletzt (fehlende Felder, falsche Typen)
- `client_state_sync` — UI-State weicht von Runtime-Status ab (Reload/Recovery)
- `persistence_data_integrity` — Persistenz-/Dateninkonsistenz (`assessments`, `assessment_answers`)
- `test_gap` — Defect war nicht durch bestehenden Test abgedeckt
- `ops_configuration` — Umgebungs-/Feature-Flag-/Konfigurationsproblem

Mehrfachauswahl ist erlaubt, aber **genau ein Primary-Tag** ist Pflicht.

## Defect Record (Vorlage)

```md
### DEFECT <laufende_nummer>
- Date: YYYY-MM-DD
- Owner: <name>
- Severity: P0|P1|P2|P3
- Status: open|in_progress|blocked|resolved
- Primary Root-Cause Tag: <tag>
- Secondary Tags: <tag_1>, <tag_2>
- Golden-Set Scenario ID: <z. B. 07-medication-negative-variant>
- Affected Area: <api|dialog|classification|objective-model|tests|ops>

- Symptom:
  - <kurze, beobachtbare Fehlerbeschreibung>

- Expected:
  - <Soll-Verhalten>

- Actual:
  - <Ist-Verhalten>

- Reproduction:
  1. <step>
  2. <step>
  3. <step>

- Root Cause Summary:
  - <1-3 Sätze zur eigentlichen Ursache, kein Symptom-Rephrasing>

- Fix Plan:
  - <konkrete Code-/Config-Änderung>

- Regression Test Plan:
  - Unit/Integration: <test file + case>
  - E2E (falls nötig): <spec + scenario>

- Evidence:
  - Commit: <hash>
  - Test output: <kurzer Befund>
  - Report reference: docs/cre/golden-set/latest.json

- Exit Criteria:
  - [ ] Fix merged
  - [ ] Regression test added/updated
  - [ ] Golden-Set run green
  - [ ] Checklist/Changelog updated
```

## Triage Board (kompakte Tabelle)

| ID | Severity | Status | Primary Tag | Scenario | Owner | ETA | Blocker |
|---|---|---|---|---|---|---|---|
| DEFECT-001 | P1 | in_progress | duplicate_question_guard | 07-medication-negative-variant | tbd | 2026-02-16 | none |

## Decision-Regeln

- Jeder `P0/P1` Defect benötigt im selben Arbeitstag:
  - Root-Cause-Eintrag
  - Fix-Plan
  - Regression-Test-Plan
- `critical_defects_open` in NV1 Exit-Check darf nur dann `0` sein, wenn alle `P0/P1` den Status `resolved` haben und Tests grün sind.
- Defect ohne Root-Cause-Tag gilt als **nicht triagiert**.

## Minimaler Daily-Ablauf (15 Min)

1. Neue Defects seit letztem Lauf erfassen
2. Severity + Primary Root-Cause Tag setzen
3. Owner + ETA vergeben
4. Für `P0/P1`: Fix/Regression-Test-Plan eintragen
5. Status in v0.8 Checklist aktualisieren

## Verknüpfte Artefakte

- v0.8 Checklist: `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`
- Golden-Set Report: `docs/cre/golden-set/latest.md`
- Golden-Set JSON: `docs/cre/golden-set/latest.json`
