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

- [~] Scope-Freeze für NV1-NV5 abgestimmt (Med + BE + Product)
- [~] KPI-Baselines erhoben und dokumentiert
- [~] Weekly Review-Terminserie aktiv
- [x] Go/No-Go Template vorbereitet
- [x] Hotfix: Clarification-Loop Suppression bei beantworteten Follow-up-Fragen aktiv

#### Meta Evidenzstand (laufend)
- [x] Initialer KPI-Baseline-Snapshot aus aktuellen Golden-Set/NV2/NV3 Evidenzen dokumentiert (`docs/cre/V0_8_KPI_BASELINE_SNAPSHOT_2026-02-16.md`)
- [x] Scope-Freeze Decision Packet mit NV1-NV5 Scope-Grid und Freeze-Regeln vorbereitet (`docs/cre/V0_8_SCOPE_FREEZE_DECISION_PACKET.md`)
- [x] Weekly-Review-Cadence-Plan mit Rhythmus, Agenda und Governance vorbereitet (`docs/cre/V0_8_WEEKLY_REVIEW_CADENCE_PLAN.md`)
- [~] Produktivnahe Shadow-Mode-Istwerte für finale Baseline-Freigabe noch offen

---

## CRE-NV1 — Test Härtung & Golden Set (Woche 1-2)

### Issues
- [x] CRE-NV1-01 Golden-Set v1 definieren (30-50 Fälle)
- [~] CRE-NV1-02 Golden-Set E2E Runner (batch + report)
- [x] CRE-NV1-03 Defect-Triage-Template + Root-Cause-Tags
- [x] CRE-NV1-04 Follow-up Repeat-Fragen Regression-Tests

### Exit-Check
- [x] `golden_set_pass_rate >= 0.95`
- [ ] `critical_defects_open = 0`
- [ ] Kritische Defects mit Fix + Regression-Test geschlossen

#### NV1 Evidenzstand (laufend)
- [x] Runner über `npm run cre:golden-set` verfügbar und lokal ausführbar
- [x] Report-Artefakte werden nach `docs/cre/golden-set/latest.md` und `docs/cre/golden-set/latest.json` geschrieben
- [x] KPI-Summary im JSON/Markdown enthalten (`golden_set_pass_rate`, `followup_repeat_question_rate`, `objective_reask_violation_count`)
- [x] Defect-Triage-Template mit Root-Cause-Tags dokumentiert (`docs/cre/DEFECT_TRIAGE_TEMPLATE_NV1.md`)
- [x] Repeat-Regression-Matrix + Variantenfälle (`nein|nei|nope`) dokumentiert (`docs/cre/golden-set/REPEAT_QUESTION_REGRESSION_MATRIX_NV1.md`)
- [x] Golden-Set-Umfang auf 30 Fälle ausgebaut (S24-S30), Batch-Lauf grün (30/30)

---

## CRE-NV2 — Patient UX/UI Testready (Woche 1-2, parallel)

### Issues
- [x] CRE-NV2-01 UX-State-Katalog finalisieren
- [~] CRE-NV2-02 Patient-Microcopy für Kernübergänge vereinheitlichen
- [~] CRE-NV2-03 Stabile E2E-Selektoren im Dialog ergänzen
- [~] CRE-NV2-04 Retry/Back/Reload deterministisch absichern
- [~] CRE-NV2-05 Mobile Readiness Check (Viewport/Scroll/Keyboard)

### Exit-Check
- [ ] 100% definierte UX-States in manuellen Testfällen abgedeckt
- [ ] 0 offene P0/P1 UI-Bugs im Patient-Dialog
- [~] E2E-Smoke Kernpfad in 3 konsekutiven Läufen stabil
- [ ] Kein kritischer Copy-Bruch in Kernübergängen

#### NV2 Evidenzstand (laufend)
- [x] UX-State-Katalog für Patient-Dialog finalisiert und mit State→Test-Mapping dokumentiert (`docs/cre/PATIENT_DIALOG_UX_STATE_CATALOG_NV2.md`)
- [x] Manuelle NV2-Testcheckliste für offene Restpunkte (Voice, Netzwerk/Retry, Accessibility, Copy-Review) als abhakbares Artefakt ergänzt (`docs/cre/PATIENT_DIALOG_NV2_MANUAL_TEST_CHECKLIST.md`)
- [x] Follow-up-Microcopy im Kernübergang harmonisiert ("Rueckfrage" → "Frage" in Lead/Prefix/Hinweis) und Sanitizing/Context-Detection kompatibel gehalten
- [x] E2E-Selektor-Härtung im Follow-up-Dialog ergänzt (`Senden`-Button in Spec explizit auf `.first()` fixiert), um Strict-Locator-Ambiguität zu vermeiden
- [x] Follow-up-Loop-Spec im Mock-Mode 3x konsekutiv stabil ausgeführt (`tests/e2e/patient-followup-loop.spec.ts`, je Lauf: 2 passed / 1 skipped)
- [x] Deterministischer Back/Forward+Reload-Pfad im Follow-up als E2E ergänzt und grün verifiziert (`tests/e2e/patient-followup-loop.spec.ts`, 3 passed / 1 skipped)
- [x] Mobiler Readiness-Pfad für kleinen Viewport + Scroll-Recovery + Keyboard-Submit (`Enter`) ergänzt und grün verifiziert (`tests/e2e/patient-followup-loop.spec.ts`, 4 passed / 1 skipped)
- [~] Kernpfad-Stabilität größtenteils belegt; finale NV2-Gates hängen an der Durchführung/Dokumentation der manuellen Checkliste

---

## CRE-NV3 — Controlled Pilot / Shadow Mode (Woche 3-5)

### Issues
- [~] CRE-NV3-01 Shadow-Mode Betrieb mit Fallvolumen starten
- [~] CRE-NV3-02 KPI-Thresholds kalibrieren
- [x] CRE-NV3-03 Monitoring-Review Routine etablieren

### Exit-Check
- [ ] KPI-Stabilität über 2 Wochen
- [ ] Kein unadressierter `critical` Alert
- [ ] Klinisches Review bestätigt Alltagstauglichkeit

#### NV3 Evidenzstand (laufend)
- [x] Shadow-Mode Runbook mit Rollen, Fallvolumen-Ramp-up, Daily/Weekly-Ablauf und Eskalationslogik dokumentiert (`docs/cre/NV3_SHADOW_MODE_OPERATION_RUNBOOK.md`)
- [x] KPI-Threshold-Kalibrierungsblatt mit Start-Schwellen, Baseline-Tabelle und Änderungsprotokoll erstellt (`docs/cre/NV3_KPI_THRESHOLD_CALIBRATION_2026-02-16.md`)
- [x] Go/No-Go Entscheidungs-Template für v0.8 vorbereitet (`docs/cre/V0_8_GO_NO_GO_TEMPLATE.md`)
- [x] Weekly-Monitoring-Review-Protokoll mit KPI-Snapshot, Alert-Priorisierung, Owner/ETA und Risikoentscheid als Vorlage erstellt (`docs/cre/NV3_WEEKLY_MONITORING_REVIEW_TEMPLATE.md`)
- [~] Operative Durchführung (reale Fallvolumen-Läufe + 2-Wochen-Stabilitätsnachweis) ausstehend

---

## CRE-NV4 — Workflow & UX Refinement (Woche 6-8)

### Issues
- [x] CRE-NV4-01 Gesprächsleitfaden v2 für PAT umsetzen
- [x] CRE-NV4-02 Follow-up Orchestrierung v2 (Anti-Repeat + Kontext)
- [x] CRE-NV4-03 Follow-up State-Machine + Answer-Klassifikation (systemisch)
- [x] CRE-NV4-04 Clinician Review UX Beschleunigung
- [x] CRE-NV4-05 Objective/Slot-Modell für Anamnese-Steuerung einführen

#### NV4-03 Fortschritt
- [x] Deterministische Answer-Klassifikation (`answered|partial|unclear|contradiction`) im Follow-up-Backend integriert
- [x] State-Machine-Transitions auf Basis der Klassifikation verdrahtet (`answered/partial` => advance, `unclear/contradiction` => klären)
- [x] KPI-Hooks fuer `clarification_loop_rate` und `resolved_followup_rate` integriert
- [x] Objective-/Slot-Metadaten (`objectives`, `active_objective_ids`) im Follow-up-Generator integriert
- [x] Golden-Set Regressionen für Klassifikationspfade vollständig abdecken

### Exit-Check
- [ ] Wiederholfragen um >= 50% ggü. Wave-5-Baseline reduziert
- [ ] `clarification_loop_rate` signifikant ggü. Wave-5-Baseline reduziert
- [ ] `resolved_followup_rate` im Zielkorridor stabil
- [~] `objective_reask_violation_count = 0` im Golden-Set
- [x] Slot-basierte Follow-up-Planung über `objective_id` aktiv
- [ ] `patient_dialog_dropoff_rate` ggü. Wave-6-Baseline verbessert
- [ ] Positive qualitative UX-Rückmeldung klinisch dokumentiert

#### NV4 Exit-Check — Evidenzstand (fokussiert)
- [x] Technischer Guard gegen unmittelbare Re-Ask-Echos in API + Dialog aktiv
- [x] Typo-/Varianz-tolerante Negativ-Erkennung (`nein|nee|nope|nei` etc.) aktiv
- [x] Follow-up bleibt im orchestrierten Pfad; kein unkontrollierter Chat-Fallback im Antwortturn
- [~] Golden-Set-Nachweis für `objective_reask_violation_count = 0` lokal regressionsstabil, aber Wave-5-Batch-Report noch ausstehend
- [ ] KPI-Nachweis gegen Baseline (`repeat_question_rate`, `clarification_loop_rate`, `resolved_followup_rate`) noch nicht final dokumentiert

#### NV4 Exit-Check — Nächste Gates
- [ ] Baseline-Referenz für Wave-5/6 fixieren und im Monitoring-Dokument verlinken
- [ ] Golden-Set Batch-Lauf (30-50 Fälle) mit Report archivieren
- [ ] KPI-Vergleichsreport (vorher/nachher) für Repeat/Clarification/Resolved erstellen
- [ ] Klinisches Kurzreview (qualitatives Feedback) als Evidence-Notiz anhängen

---

## CRE-NV5 — Readiness Gate & Release (Woche 9-10)

### Issues
- [~] CRE-NV5-01 Release-Readiness Report erstellen
- [ ] CRE-NV5-02 Go/No-Go Gate mit dokumentiertem Risikoentscheid
- [~] CRE-NV5-03 Staged Rollout + Rollback Playbook finalisieren

#### NV5 Evidenzstand (laufend)
- [x] Release-Readiness-Report als ausfüllbarer Draft mit Gate-/KPI-/Risiko-Sektionen vorbereitet (`docs/cre/NV5_RELEASE_READINESS_REPORT_DRAFT.md`)
- [x] Staged-Rollout/Rollback-Playbook mit Phasen, Stop-/Rollback-Kriterien und Verantwortlichkeiten vorbereitet (`docs/cre/NV5_STAGED_ROLLOUT_ROLLBACK_PLAYBOOK.md`)
- [~] Finale Befüllung mit Shadow-Mode-Istwerten und Sign-off steht aus

### Exit-Check
- [ ] Keine offenen Safety-Kritiker
- [ ] KPI-Schwellen über 2 Wochen gehalten
- [ ] Export-/Audit-Compliance vollständig
- [ ] Monitoring + Alerting operativ bestätigt

---

## Wiedervorlage — Propädeutische Anamnese-Struktur (später)

Hinweis:
- Dieser Block ist bewusst als spätere Vertiefung markiert und wird nach Stabilisierung der aktuellen v0.8-Gates fortgeführt.

### Arbeitsstruktur (medizinisch + PAT-fähig)
- [ ] Leitsymptom/Anliegen als Pflicht-Einstieg normieren
- [ ] Aktuelle Beschwerden via OPQRST/10W als strukturierter Kernblock festlegen
- [ ] Red-Flag/Sicherheitsblock mit klaren Eskalationskriterien binden
- [ ] Vorerkrankungen + Medikation + Allergien als Pflichtfelder harmonisieren
- [ ] Familien- und Sozialanamnese als getrennte, auswertbare Blöcke konsolidieren
- [ ] Systemanamnese fokussiert pro Leitsymptom als optionalen Vertiefungsblock abbilden
- [ ] PAT-Follow-up strikt auf Lückensteuerung (keine Re-Ask-Duplikate) an diese Struktur koppeln

### Delivery-Gates
- [ ] Funnel/Prompt/Output-Schema auf identische Blockreihenfolge gebracht
- [ ] Mapping in `STRUCTURED_INTAKE` für alle Pflichtblöcke verifiziert
- [ ] Klinische Lesbarkeit des Kurzbefunds im Review bestätigt

Artefakt:
- Draft-Mapping dokumentiert in `docs/cre/PROPAEDEUTISCHE_ANAMNESE_MAPPING_V08_DRAFT.md`.

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
- 2026-02-15 13:04:14 (lokal): Medikationslogik korrigiert, sodass eine negative Kurzantwort wie „nein“ als beantwortet gilt und keine unsinnige Detail-Rueckfrage zu konkreten Mitteln mehr ausloest.
- 2026-02-15 13:05:39 (lokal): PAT-Einstiegs- und Follow-up-Microcopy gestrafft, sodass Standard-Gap-Fragen direkt und ohne redundanten Themenvorspann gestellt werden.
- 2026-02-15 13:42:58 (lokal): CRE-Komponenten-Interaktionsschema als Architekturübersicht erstellt, inklusive Laufzeitfluss zwischen Dialog, Intake, Safety, Reasoning, Follow-up, Persistenz und HITL.
- 2026-02-15 13:53:26 (lokal): v0.8-Roadmap strukturell angepasst, indem NV4 um ein Objective/Slot-Steuerungsmodell mit klaren Issues, Exit-Kriterien und KPIs für re-ask-freie Anamneseplanung erweitert wurde.
- 2026-02-15 14:04:02 (lokal): Signifikanter NV4-Block umgesetzt, indem Follow-up auf objective/slot-basierte Steuerung (active_objective_ids + safety-aware objective status) umgestellt und im Dialog als sichtbarer Anamnese-Fortschritt eingeblendet wurde.
- 2026-02-15 14:22:10 (lokal): NV4 finalisiert, indem PAT-Leitfaden v2 aktiviert, Clinician-Requests auf Objective-Slots gemappt/gefiltert (keine Re-Ask bei gelösten Zielen), zielgerichtete Regressionstests ergänzt und Clinician-Review per Schnell-Einfügen offener Anamneseziele beschleunigt wurde.
- 2026-02-15 16:06:12 (lokal): NV4 Exit-Check fokussiert, indem Re-Ask-Kernpfad server- und clientseitig verhärtet, Negative-Intent-Erkennung für Tippfehler/Varianten erweitert und der Evidenzstand für verbleibende KPI-/Golden-Set-Gates explizit dokumentiert wurde.
- 2026-02-15 16:18:44 (lokal): NV1 gestartet, indem der Coherence-Runner als Golden-Set-Entrypoint verdrahtet (`npm run cre:golden-set`), um KPI-Summary erweitert und dedizierte Reports unter `docs/cre/golden-set/latest.(md|json)` erzeugt wurden (lokal: 10/10 passed).
- 2026-02-15 16:27:09 (lokal): NV1-03 abgeschlossen, indem ein standardisiertes Defect-Triage-Template mit Severity-Regeln, Root-Cause-Tag-Taxonomie und Evidence-/Regression-Checkliste unter `docs/cre/DEFECT_TRIAGE_TEMPLATE_NV1.md` ergänzt wurde.
- 2026-02-15 16:36:18 (lokal): NV1-04 umgesetzt, indem Repeat-Fragen-Regressionen als Matrix dokumentiert, Golden-Set um Variantenfälle (`nein|nei|nope`) erweitert und Duplicate-Assertions (`forbid_duplicate_questions`, `forbid_duplicate_objective_ids`) im Runner verdrahtet wurden.
- 2026-02-15 16:44:57 (lokal): NV1-01 weiter ausgebaut, indem Golden-Set um 10 zusätzliche Regression-Fälle (S14-S23) erweitert und der Batch-Lauf mit 23/23 erfolgreichen Szenarien verifiziert wurde.
- 2026-02-16 10:12:03 (lokal): Scope-Anpassung PAT Dialog umgesetzt, indem ein Behavior Contract v1 (krankheitsbild-agnostische, arztähnliche Anamnese) dokumentiert und ein adversarial Turn-Quality-Guard für Boundary-Test/Nonsense im `/api/amy/chat` integriert wurde.
- 2026-02-16 10:48:37 (lokal): Scope erweitert, indem ein adversarial Golden-Set Runner (`npm run cre:adversarial`) mit 10 Dialogfällen ergänzt, die Guard-Klassifikation gegen explizite "nur Test/keine echten Symptome"-Turns gehärtet und in der Studio-Benutzerverwaltung die Anlage neuer Testnutzer (E-Mail, Passwort, Rolle) serverseitig/admin-only freigeschaltet wurde.
- 2026-02-16 11:32:00 (lokal): Erstaufnahme-Funnel erweitert, indem ein neues Assessment `first-intake-sociological-anamnesis` (V0.5 Catalog+Version mit soziologischen Anamnese-Fragen) per Migration angelegt, in Tier-1/Allowlist freigeschaltet und als Standard-Startfunnel im Patient-Flow (Resolver + Tests) verdrahtet wurde.
- 2026-02-16 11:57:00 (lokal): Erstaufnahme im UI und PAT/Anamnese weiter integriert, indem auf `/patient/start` eine sichtbare Erstaufnahme-Box mit Start-CTA ergänzt sowie Erstaufnahme-Antworten als strukturierter Kontext in `/api/amy/chat` und `/api/clinical-intake/generate` eingebunden wurden.
- 2026-02-16 12:09:00 (lokal): Propädeutische Anamnese-Struktur als Wiedervorlage in v0.8 aufgenommen (Leitsymptom, OPQRST/10W, Red-Flags, PMH/Medikation/Allergien, Familien-/Sozialanamnese, systematische Follow-up-Lückensteuerung).
- 2026-02-16 12:26:00 (lokal): Stabilitäts-Gate Schritt 1 umgesetzt, indem ein fokussierter E2E-Smoke-Test für die Erstaufnahme-CTA auf `/patient/start` ergänzt und in Mock-Mode erfolgreich ausgeführt wurde (`tests/e2e/patient-intake-start-cta.spec.ts`).
- 2026-02-16 12:31:00 (lokal): Data-/Struktur-Gates Schritt 2+3 umgesetzt, indem Unit-Tests für die Erstaufnahme-Kontextableitung (`psychosocial_factors`) ergänzt und ein Block→Feld→PAT-Regel-Mapping als Draft dokumentiert wurden (`lib/clinicalIntake/__tests__/firstIntakeSociologicalContext.test.ts`, `docs/cre/PROPAEDEUTISCHE_ANAMNESE_MAPPING_V08_DRAFT.md`).
- 2026-02-16 13:14:00 (lokal): NV2-03 weitergeführt, indem Dialog-Selektoren im Follow-up-E2E gehärtet (`Senden` auf `.first()`) und der Mock-Mode Follow-up-Loop 3x konsekutiv stabil verifiziert wurde (`tests/e2e/patient-followup-loop.spec.ts`).
- 2026-02-16 13:24:00 (lokal): NV2-04 gestartet, indem ein deterministischer Back/Forward+Reload-Recovery-Test für den Follow-up-Dialog ergänzt und im Mock-Mode erfolgreich ausgeführt wurde (`tests/e2e/patient-followup-loop.spec.ts`).
- 2026-02-16 13:37:00 (lokal): NV2-05 gestartet, indem ein mobiler Readiness-Test (kleiner Viewport, Scroll-Recovery, Keyboard-Submit via `Enter`) im Follow-up-Spec ergänzt und im Mock-Mode erfolgreich ausgeführt wurde (`tests/e2e/patient-followup-loop.spec.ts`).
- 2026-02-16 13:49:00 (lokal): NV2-02 vorgezogen, indem Kern-Microcopy im Follow-up-Dialog auf konsistente "Frage"-Formulierungen harmonisiert und über den Mock-Mode-Spec mit sichtbarer Copy-Assertion regressionsgesichert wurde (`apps/rhythm-patient-ui/app/patient/(mobile)/dialog/DialogScreenV2.tsx`, `tests/e2e/patient-followup-loop.spec.ts`).
- 2026-02-16 14:02:00 (lokal): NV2-01 abgeschlossen, indem ein dedizierter UX-State-Katalog für den Patient-Dialog mit State-Definitionen, erwarteten UX-Verhalten und Test-Mapping erstellt wurde (`docs/cre/PATIENT_DIALOG_UX_STATE_CATALOG_NV2.md`).
- 2026-02-16 14:12:00 (lokal): NV2-Exit operationalisiert, indem eine abhakbare manuelle Testcheckliste für die offenen Restpunkte (Voice, Netzwerk/Retry, Accessibility, Copy-Review) ergänzt und mit dem UX-State-Katalog verlinkt wurde (`docs/cre/PATIENT_DIALOG_NV2_MANUAL_TEST_CHECKLIST.md`).
- 2026-02-16 14:24:00 (lokal): NV1-01 abgeschlossen, indem das Golden-Set um sieben zusätzliche Regression-Fälle (S24-S30) auf 30 Szenarien erweitert und mit `npm run cre:golden-set` erfolgreich als 30/30 validiert wurde (Reports in `docs/cre/coherence/latest.(md|json)` und `docs/cre/golden-set/latest.(md|json)`).
- 2026-02-16 14:36:00 (lokal): NV3-Start vorbereitet, indem ein operatives Shadow-Mode-Runbook, ein KPI-Threshold-Kalibrierungsblatt und ein v0.8 Go/No-Go-Template erstellt und in der Checklist als Evidenz verankert wurden (`docs/cre/NV3_SHADOW_MODE_OPERATION_RUNBOOK.md`, `docs/cre/NV3_KPI_THRESHOLD_CALIBRATION_2026-02-16.md`, `docs/cre/V0_8_GO_NO_GO_TEMPLATE.md`).
- 2026-02-16 14:44:00 (lokal): NV3-03 abgeschlossen, indem eine ausfüllbare Weekly-Monitoring-Review-Vorlage mit KPI-Snapshot, Alert-Priorisierung, Root-Cause/Maßnahmen, Owner/ETA und Risikoentscheid ergänzt wurde (`docs/cre/NV3_WEEKLY_MONITORING_REVIEW_TEMPLATE.md`).
- 2026-02-16 14:53:00 (lokal): Meta-Gate KPI-Baselines auf in Arbeit gebracht, indem ein initialer Baseline-Snapshot aus Golden-Set/NV2/NV3-Evidenz erstellt und als Arbeitsgrundlage für die Shadow-Mode-Erstbefüllung dokumentiert wurde (`docs/cre/V0_8_KPI_BASELINE_SNAPSHOT_2026-02-16.md`).
- 2026-02-16 15:03:00 (lokal): Meta-/NV5-Vorbereitung autonom weitergeführt, indem ein Weekly-Review-Cadence-Plan, ein Scope-Freeze-Decision-Packet und ein NV5-Readiness-Report-Draft ergänzt und in der Checklist als Evidenz verankert wurden (`docs/cre/V0_8_WEEKLY_REVIEW_CADENCE_PLAN.md`, `docs/cre/V0_8_SCOPE_FREEZE_DECISION_PACKET.md`, `docs/cre/NV5_RELEASE_READINESS_REPORT_DRAFT.md`).
- 2026-02-16 15:12:00 (lokal): NV5-03 vorbereitet, indem ein Staged-Rollout/Rollback-Playbook mit Preflight/Canary/Ramp/Broad-Phasen, Stop-Kriterien, Rollback-Ablauf und Ownern ergänzt und in der Checklist verankert wurde (`docs/cre/NV5_STAGED_ROLLOUT_ROLLBACK_PLAYBOOK.md`).
- 2026-02-16 15:24:00 (lokal): Erstaufnahme-Flow-Ladefehler behoben, indem Funnel-Manifeste ohne `schema_version` beim Laden rückwärtskompatibel auf `v1` normalisiert und mit Regressionstest gegen den Fehlerpfad abgesichert wurden (`lib/funnels/loadFunnelVersion.ts`, `lib/funnels/__tests__/effectiveVersionResolution.test.ts`).
- 2026-02-16 15:36:00 (lokal): Studio-Metrics Lesbarkeit und KPI-Kontext verbessert, indem KPI-Karten um Info-Tooltips (Definition), Referenzwerte aus `kpi_thresholds` mit `TBD`-Fallback sowie kontrastreichere Darstellung für Karten und Trend-Tabelle erweitert wurden (`apps/rhythm-studio-ui/app/clinician/admin/metrics/page.tsx`).
- 2026-02-16 15:45:00 (lokal): Metrics-Network-Noise reduziert, indem KPI-Thresholds direkt über `/api/admin/metrics` mitgeliefert und der separate Frontend-Request auf `/api/admin/kpi-thresholds` entfernt wurde (vermeidet zusätzlichen 404-Call und vereinfacht die Datenladung).
- 2026-02-16 16:02:00 (lokal): PAT-Startverhalten gestrafft, indem beim Erstbesuch eine kurze Zielerklaerung + Leitfrage angezeigt wird und bei Folgebesuchen ein kurzer "Wo stehen wir/was fehlt noch"-Kontext mit Anschlussfrage ausgegeben wird (`apps/rhythm-patient-ui/app/patient/(mobile)/dialog/DialogScreenV2.tsx`, `apps/rhythm-patient-ui/app/api/amy/chat/route.ts`).
