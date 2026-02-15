# v0.8 Execution Checklist (Stand 2026-02-15)

Zweck:
- Operative Abarbeitung der kommenden Version v0.8 als abhakebare Checkliste.
- Basis: `EPICS_AND_ISSUES_NEXT_VERSION_2026-02-15.md`.

Statuswerte:
- [ ] offen
- [x] erledigt
- [~] in Arbeit
- [-] blockiert

---

## Meta-Gates v0.8

- [ ] Scope-Freeze für NV1-NV5 abgestimmt (Med + BE + Product)
- [ ] KPI-Baselines erhoben und dokumentiert
- [ ] Weekly Review-Terminserie aktiv
- [ ] Go/No-Go Template vorbereitet
- [x] Hotfix: Clarification-Loop Suppression bei beantworteten Follow-up-Fragen aktiv

---

## CRE-NV1 — Test Härtung & Golden Set (Woche 1-2)

### Issues
- [ ] CRE-NV1-01 Golden-Set v1 definieren (30-50 Fälle)
- [ ] CRE-NV1-02 Golden-Set E2E Runner (batch + report)
- [ ] CRE-NV1-03 Defect-Triage-Template + Root-Cause-Tags
- [ ] CRE-NV1-04 Follow-up Repeat-Fragen Regression-Tests

### Exit-Check
- [ ] `golden_set_pass_rate >= 0.95`
- [ ] `critical_defects_open = 0`
- [ ] Kritische Defects mit Fix + Regression-Test geschlossen

---

## CRE-NV2 — Patient UX/UI Testready (Woche 1-2, parallel)

### Issues
- [ ] CRE-NV2-01 UX-State-Katalog finalisieren
- [ ] CRE-NV2-02 Patient-Microcopy für Kernübergänge vereinheitlichen
- [ ] CRE-NV2-03 Stabile E2E-Selektoren im Dialog ergänzen
- [ ] CRE-NV2-04 Retry/Back/Reload deterministisch absichern
- [ ] CRE-NV2-05 Mobile Readiness Check (Viewport/Scroll/Keyboard)

### Exit-Check
- [ ] 100% definierte UX-States in manuellen Testfällen abgedeckt
- [ ] 0 offene P0/P1 UI-Bugs im Patient-Dialog
- [ ] E2E-Smoke Kernpfad in 3 konsekutiven Läufen stabil
- [ ] Kein kritischer Copy-Bruch in Kernübergängen

---

## CRE-NV3 — Controlled Pilot / Shadow Mode (Woche 3-5)

### Issues
- [ ] CRE-NV3-01 Shadow-Mode Betrieb mit Fallvolumen starten
- [ ] CRE-NV3-02 KPI-Thresholds kalibrieren
- [ ] CRE-NV3-03 Monitoring-Review Routine etablieren

### Exit-Check
- [ ] KPI-Stabilität über 2 Wochen
- [ ] Kein unadressierter `critical` Alert
- [ ] Klinisches Review bestätigt Alltagstauglichkeit

---

## CRE-NV4 — Workflow & UX Refinement (Woche 6-8)

### Issues
- [ ] CRE-NV4-01 Gesprächsleitfaden v2 für PAT umsetzen
- [ ] CRE-NV4-02 Follow-up Orchestrierung v2 (Anti-Repeat + Kontext)
- [~] CRE-NV4-03 Follow-up State-Machine + Answer-Klassifikation (systemisch)
- [ ] CRE-NV4-04 Clinician Review UX Beschleunigung

#### NV4-03 Fortschritt
- [x] Deterministische Answer-Klassifikation (`answered|partial|unclear|contradiction`) im Follow-up-Backend integriert
- [x] State-Machine-Transitions auf Basis der Klassifikation verdrahtet (`answered/partial` => advance, `unclear/contradiction` => klären)
- [x] KPI-Hooks fuer `clarification_loop_rate` und `resolved_followup_rate` integriert
- [ ] Golden-Set Regressionen für Klassifikationspfade vollständig abdecken

### Exit-Check
- [ ] Wiederholfragen um >= 50% ggü. Wave-5-Baseline reduziert
- [ ] `clarification_loop_rate` signifikant ggü. Wave-5-Baseline reduziert
- [ ] `resolved_followup_rate` im Zielkorridor stabil
- [ ] `patient_dialog_dropoff_rate` ggü. Wave-6-Baseline verbessert
- [ ] Positive qualitative UX-Rückmeldung klinisch dokumentiert

---

## CRE-NV5 — Readiness Gate & Release (Woche 9-10)

### Issues
- [ ] CRE-NV5-01 Release-Readiness Report erstellen
- [ ] CRE-NV5-02 Go/No-Go Gate mit dokumentiertem Risikoentscheid
- [ ] CRE-NV5-03 Staged Rollout + Rollback Playbook finalisieren

### Exit-Check
- [ ] Keine offenen Safety-Kritiker
- [ ] KPI-Schwellen über 2 Wochen gehalten
- [ ] Export-/Audit-Compliance vollständig
- [ ] Monitoring + Alerting operativ bestätigt

---

## Tracking-Rhythmus

- [ ] Daily: 15min Defect-Triage durchgeführt
- [ ] Weekly: CRE Monitoring Review durchgeführt
- [ ] Biweekly: Med+BE+Product Decision Gate durchgeführt
- [ ] End-of-Wave: Formales Exit-Review dokumentiert

---

## Abschluss v0.8

- [ ] Alle NV-Issues abgeschlossen oder sauber in nächste Version überführt
- [ ] Release Notes final
- [ ] Tag erstellt
- [ ] GitHub Release veröffentlicht

---

## Change Log

v0.7 wurde abgeschlossen (Tag/Release), v0.8-Planung und Checklistenstruktur stehen.
Patient-UX-Fixes wurden umgesetzt (Login-Weiterleitung, Enter-send, kompakter/rechts ausgerichteter Input-Bereich, Redirect auf /patient/start).
Follow-up-Logik wurde systemisch erweitert (Klassifikation answered|partial|unclear|contradiction, State-Transitions, Monitoring-KPIs).
Deploy-Blocker (TypeScript Event-Union) wurde behoben und Build wieder stabilisiert.
Aktuellster Fix: Sackgasse im Follow-up geschlossen („bereits genannt/in den Daten“ führt nicht mehr in Re-Ask-Loop), mit Regressionstests abgesichert und nach main gepusht (dfa7f865).

- 2026-02-15 12:34:21 (lokal): Follow-up-Sackgasse behoben, indem Antworten wie „bereits genannt/in den Daten“ als beantwortet klassifiziert, gegen Re-Ask-Loops abgesichert, mit Regressionstests verifiziert und auf `main` gepusht wurden.
- 2026-02-15 12:41:13 (lokal): Klassifikationslogik erweitert, sodass Formulierungen wie „Du kennst meine Medikation bereits“ als beantwortet erkannt und mit Regressionstest gegen erneute Re-Ask-Loops abgesichert werden.
- 2026-02-15 12:56:30 (lokal): Produktive Frageformulierung verbessert, indem Follow-up-Prompts im Dialog entdoppelt/saniert und generische Partial-Rueckfragen im Backend auf klare, nicht-echoende Sprache umgestellt wurden.
