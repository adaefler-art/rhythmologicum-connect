# v0.8 Execution Checklist (Stand 2026-02-19, PAT Intake Architektur v2)

Zweck:
- v0.8 auf die PAT-v2-Intake-Architektur umstellen.
- Drei operative Use-Cases definieren (statt funktionsorientierter Teiltracks).
- Bestehende offene Liste konsolidieren: was wird übernommen, was wird verworfen/verschoben.

Referenzen:
- `docs/cre/source/PAT_Intake_Architektur_v2.docx`
- `docs/cre/OPEN_MANUAL_GATES_DAILY_VIEW.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`
- `docs/cre/ROLLOUT_USE_CASE_PLAN_2026-02-17.md`
- `docs/cre/UC1_MANUAL_TEST_CATCHUP_RUNBOOK_2026-02-19.md`

Statuswerte:
- [ ] offen
- [~] in Arbeit
- [x] erledigt
- [-] blockiert

---

## 1) Architektur-Zielbild für v0.8

Leitprinzip:
- Clinical Readiness statt Vollständigkeit.
- LLM interpretiert/strukturiert, Rule Engine entscheidet Safety-relevante Übergänge.

Verbindliche technische Invarianten:
- [ ] Zustandsmaschine mit klaren Zuständen und Übergängen aktiv (`SafetyReady`, `VisitReady`, `ProblemReady`, `ProgramReady`)
- [ ] Keine Level-Sprünge ohne definierte Trigger (Step-Skipping Prevention bleibt hart)
- [ ] Fallback-Pfad bei unvollständiger/unklarer Eingabe (konservativer Routingpfad)
- [ ] Resume/Unterbrechbarkeit ohne Datenverlust (insb. längere Flows)
- [ ] Safety-Overrides deterministisch im Backend (nicht LLM-gesteuert)

---

## 2) Drei Use-Cases nach PAT-v2 (v0.8 Scope)

## UC1 — Clinical Entry (Ebene 1+2: Ultra-Rapid Triage + VisitPreparation)

Ziel:
- In 30s–15min von Erstkontakt zu `VisitReady` oder sicherem Eskalationspfad.

Definition of Done:
- [~] Safety-Routing mit 4 Pfaden stabil (`Notruf`, `Notaufnahme`, `dringender Termin`, `Standard-Intake`)
- [~] VisitPreparation erzeugt strukturierte Kurzakte (`Hauptbeschwerde`, Verlauf, Red Flags, Medikation)
- [ ] Keine patient-facing Diagnose-/Risikosprache
- [ ] UC1 E2E inkl. Hybrid iOS Device-Smoke grün

Arbeitspakete:
- [~] UC1-01 Runtime-State als SSOT inkl. Resume/Reload
	- [x] Step-Validation akzeptiert optionalen Triage-Safety-Kontext serverseitig
	- [x] Runtime liefert deterministischen `safetyGate` zurück (inkl. blockierendem Escalation-Pfad)
	- [x] FunnelRunner reagiert auf blockierenden Safety-Gate mit kontrollierter Support-Umleitung
- [~] UC1-02 Abschluss-/Übermittlungsflow robust + idempotent
- [~] UC1-03 Safety-Rule-Set (deterministisch) mit Evidenzfällen
	- [x] UC1 Safety-Route-Output (Notruf/Notaufnahme/dringender Termin/Standard-Intake) im Triage-Contract ergänzt
	- [x] Deterministische Safety-Route-Ableitung in `lib/triage/engine.ts` verdrahtet
	- [x] Safety-Route in Runtime-Transition integriert (`validate`-Response mit `safetyGate`)
	- [x] UC1 E2E Safety-Gate Support-Redirect für `NOTRUF` und `NOTAUFNAHME` abgedeckt (Mock-Flow)
	- [x] UC1 E2E Non-Blocking-Flow für `DRINGENDER_TERMIN` und `STANDARD_INTAKE` abgedeckt (Mock-Flow)
	- [~] Testlauf lokal/CI verifizieren (aktuelle Shell ohne Node/NPM ausführbar)
- [~] UC1-05 VisitPreparation-Kurzakte aus `structured_data` bereitstellen
	- [x] Deterministischer Builder für Kurzakte-Felder (`chiefComplaint`, Verlauf, Red Flags, Medikation)
	- [x] API `GET /api/patient/intake/latest` liefert `visit_preparation` mit
	- [~] Integration in Staging/Client-UI verifizieren
- [ ] UC1-04 iOS Session/Auth-Resilienz inkl. Relogin-Flow auf Device evidenziert
- [~] UC1-06 Manuelle Nachholtests (Alt-Checklist/Docs) konsolidiert und nachgeführt
	- [x] Nachhol-Runbook mit offenen Pflicht-Nachweisen erstellt
	- [x] Automatisierbare Nachholpunkte um API-Test erweitert (`GET /api/patient/intake/latest` inkl. `visit_preparation`)
	- [ ] Device-/Staging-Evidence gemäß Runbook ausführen und dokumentieren

## UC2 — Problem Clarification (Ebene 3: Problem-Focused Deep Dive)

Ziel:
- Bei Chronizität/Komplexität auf `ProblemReady` kommen (diagnostische Vorbereitung ohne Diagnoseausgabe).

Trigger in v0.8 (minimum):
- Symptomatik >= 12 Wochen
- Mehrere Symptomcluster ohne klare Verbindung
- Relevante chronische Grunderkrankung
- explizite Ärzt:innen-Anforderung

Definition of Done:
- [x] Trigger-Logik backend-seitig auditiert
- [x] Modulare Vertiefung (indikationsbezogen) aktiv, aber scoped auf Kernmodule
- [x] Ergebnis ist strukturierte Klärung + Open Loops, keine klinische Wertung nach außen

Arbeitspakete:
- [x] UC2-01 Trigger-Engine + Übergangsregeln dokumentiert und getestet
	- [x] Backend-Trigger für `>=12 Wochen`, `mehrere Symptomcluster`, `chronische Grunderkrankung`, `explizite Ärzt:innen-Anforderung` deterministisch implementiert
	- [x] Übergangsregel: bei aktivem UC2-Trigger und leerer Follow-up-Queue Lifecycle auf `needs_review` statt `completed`
	- [x] Unit-Regressionen für UC2-Triggergründe + Übergangsregel ergänzt
	- [x] Technische Verifikation durch Unit-/Contract-Tests ergänzt (Staging-Evidence nachgelagert in NV3)
- [x] UC2-02 Objective-/Slot-Vertiefung für komplexe Fälle erweitert
	- [x] UC2-only Deep-Dive-Slots ergänzt (`associated symptoms`, `aggravating/relieving factors`, `relevant negatives`)
	- [x] Aktivierung strikt triggergebunden (`ProblemReady`), außerhalb UC2 nicht aktiv
	- [x] Antwort-Mapping für neue Gap-IDs im Follow-up-Generate-Endpoint ergänzt
	- [x] Unit-Regressionen für Aktivierung/Nicht-Aktivierung ergänzt
	- [x] Technische Verifikation durch Runtime-/API-Regressionen ergänzt (Staging-Evidence nachgelagert in NV3)
- [x] UC2-03 Clinician-Review zeigt `captured/missing/unclear/delegated_to_physician`
	- [x] Clinician-Review-Panel rendert Objective-Case-Checklist mit allen vier Statuswerten
	- [x] Requested-Item-Suggestions berücksichtigen `missing`, `unclear` und `delegated_to_physician`
	- [x] Objective-Textmapping für bestehende + UC2-Deep-Dive-Objectives erweitert
	- [x] API-Contract-Tests für `clinical-intake/latest` inkl. Negativfall (leere Objectives) ergänzt

## UC3 — Program Intake (Ebene 4: DiagnosticProgramIntake)

Ziel:
- Für Programm-/Präventionspfade `ProgramReady` mit unterbrechbarer Vollaufnahme.

Definition of Done:
- [ ] Long-Flow in Abschnitten unterbrechbar + verlustfrei wiederaufnehmbar
- [ ] Dokument-Upload/Vorbefundintegration robust
- [ ] Dropout-Risiko aktiv gemessen und begrenzt (Zeit/Abbruchstellen transparent)

Arbeitspakete:
- [~] UC3-01 Abschnittsbasierte Savepoints je Intake-Block
	- [x] Follow-up-Lifecycle erweitert um blockbasierte Savepoints (`core_symptom_profile`, `medical_context`, `supporting_context`, `program_specific`)
	- [x] `active_block_id` für deterministisches Resume auf ersten offenen Intake-Block ergänzt
	- [x] Regressionstests für Savepoint-Ableitung ergänzt
- [ ] UC3-02 Resume-UX nach Abbruch ohne Re-Ask abgeschlossener Blöcke
- [~] UC3-03 Program-Readiness-Output als strukturiertes Artefakt
	- [x] Runtime leitet `ProgramReady` deterministisch ab, wenn Follow-up abgeschlossen und alle Savepoint-Blöcke completed sind
	- [ ] API/Export-Contract für explizites Program-Readiness-Artefakt nachziehen

---

## 3) v0.8 Roadmap (rebaselined auf PAT-v2)

## Phase A (Woche 1-2): UC1 Safety + Visit Ready stabilisieren
- [ ] Safety-Rules + konservative Fallbacks produktionsnah validieren
- [ ] UC1 E2E Staging + iOS Device Evidence abschließen
- [ ] NV2 Manual Gates final schließen

## Phase B (Woche 3-5): UC2 Problem Clarification operationalisieren
- [ ] UC2 Trigger und Deep-Dive-Module livefähig machen
- [ ] NV3 Shadow-Mode mit 2-Wochen KPI-Stabilität nachweisen
- [ ] NV4 klinisches Kurzreview als qualitative Evidenz ergänzen

## Phase C (Woche 6-8): UC3 Program Intake pilotfähig machen
- [ ] Unterbrechbarkeit/Resume für Long-Flow vollständig absichern
- [ ] Programm-Onboarding-Artefakt finalisieren
- [ ] Dropout-Hotspots identifizieren und beheben

## Phase D (Woche 9-10): Readiness & Release
- [ ] NV5 Go/No-Go mit dokumentiertem Risikoentscheid
- [ ] Staged Rollout + Rollback-Playbook final
- [ ] Release-Freigabe nur bei erfüllten Safety/Compliance/KPI-Gates

---

## 4) Übernahme aus offener Liste (NV2-NV5)

Diese Punkte werden unverändert in v0.8 übernommen:
- [ ] NV2: A-D Manual-Checkliste vollständig durchführen
- [ ] NV2: 0 offene P0/P1 UI-Bugs + finaler Copy-Review
- [ ] NV3: 2-Wochen Shadow-Mode KPI-Stabilität nachweisen
- [ ] NV3: Kein unadressierter `critical` Alert + klinisches Review
- [ ] NV4: Klinisches Kurzreview als Evidence-Notiz
- [ ] NV5: Formales Go/No-Go mit Risikoentscheid + Sign-off

Zusätzliche Übernahme (für PAT-v2 zwingend):
- [ ] Deterministische Safety-Rule-Evidenz (gegen Goldenset/Shadow-Fälle)
- [ ] State-Machine-Übergänge als prüfbarer Contract dokumentiert
- [ ] Resume/Savepoint-Nachweis für Long-Flow (UC3)

---

## 5) Verwerfen / Verschieben aus alter v0.8-Liste

Für v0.8 verworfen (nicht mehr Zielbild nach PAT-v2):
- [x] Alter UC2-Fokus als reiner Waiting-Room-Fastpass-Produkttrack
- [x] Alter UC3-Fokus als primär Audio-Silent-Listener-Produkttrack

Begründung:
- Beide Tracks sind Feature-Sichten; PAT-v2 priorisiert klinische Readiness-Ebenen (1-4) als führendes Modell.
- Fastpass- und Silent-Listener-Elemente bleiben optional als Kanal-/Interaktionsmodus, aber nicht mehr als eigene v0.8-Haupt-Use-Cases.

In v0.9+ verschieben (Backlog, kein v0.8 Gate):
- [ ] Kiosk/MDM-spezifische Betriebslogik
- [ ] Audio-first Consult Automationen mit erweitertem Consent-Layer
- [ ] Nicht-kritische Kanaloptimierungen ohne Readiness-Impact

---

## 6) Aktuelle Priorität (nächste 14 Tage)

1. [ ] UC1 End-to-End inkl. iOS Device-Nachweis final grün
2. [ ] NV2/NV3 offene Manual-Gates schließen
3. [ ] UC2 Trigger-Engine produktionsnah verifizieren
4. [ ] NV5 Entscheidungsfähigkeit absichern (Go/No-Go vorbereitet)

---

## 7) Exit-Gates v0.8

Release nur wenn alle Punkte erfüllt sind:
- [ ] Safety: keine offenen Kritiker, deterministische Eskalationspfade nachgewiesen
- [ ] Qualität: KPI-Schwellen über 2 Wochen stabil
- [ ] Compliance: Audit-/Export-Pfade vollständig verifiziert
- [ ] Betrieb: Monitoring/Alerting + Rollback operational bestätigt

---

## Change Log

- 2026-02-19: Neue Checklist-Version auf Basis PAT Intake Architektur v2 erstellt.
- 2026-02-19: Use-Cases auf klinische Readiness-Ebenen umgestellt (UC1/UC2/UC3 neu geschnitten).
- 2026-02-19: Offene Liste konsolidiert in `übernehmen` vs `verwerfen/verschieben`.
- 2026-02-19: UC1 Safety-Route in Runtime-Ende-zu-Ende verdrahtet (`validate` + `safetyGate` + Runner-Redirect) [Commit: `3935594b`].
- 2026-02-19: Safety-Route-Propagation über Router-Query und Runner-Fallback ergänzt [Commit: `3d96dc9b`].
- 2026-02-19: Patient Support Zielseite für Triage/Safety-Gate eingeführt (`/patient/support`) [Commit: `f5ba4d26`].
- 2026-02-19: Shared Support-Helfer + Testabdeckung für Triage→Support-Flow ergänzt [Commit: `1997519f`].
- 2026-02-19: E2E-Szenario für blockenden Safety-Gate-Redirect zu `/patient/support` ergänzt [Commit: `ee4c9aaf`].
- 2026-02-19: E2E-Szenario für blockenden Safety-Gate-Redirect `NOTAUFNAHME` ergänzt (UC1 Safety-Pfad erweitert) [Commit: `6ee7c54e`].
- 2026-02-19: UC1 Safety-E2E auf alle 4 Routen erweitert (`NOTRUF`, `NOTAUFNAHME`, `DRINGENDER_TERMIN`, `STANDARD_INTAKE`) und VisitPreparation-Kurzakte in `GET /api/patient/intake/latest` integriert [Commit: `f2aa1557`].
- 2026-02-19: Offene manuelle UC1/NV2-NV5 Nachholtests aus alter Checklist konsolidiert (Runbook) und zusätzlicher API-Autotest für `GET /api/patient/intake/latest` ergänzt [Commit: `cb7d2d35`].
- 2026-02-19: UC2-Trigger-Engine in der Follow-up-Runtime ergänzt (`>=12 Wochen`, Symptomcluster, chronische Signale, explizite Ärzt:innen-Anforderung) inkl. Übergangsregel auf `needs_review` und Unit-Tests (`lib/cre/followup/generator.ts`, `lib/cre/followup/__tests__/generator.test.ts`, `lib/cre/followup/schema.ts`, `lib/types/clinicalIntake.ts`).
- 2026-02-19: UC2 Deep-Dive-Objective-Slots für komplexe Fälle ergänzt (nur bei aktivem UC2-Trigger), inkl. Gap-Answer-Mapping im Follow-up-Endpoint und Regressionstests (`lib/cre/followup/generator.ts`, `apps/rhythm-patient-ui/app/api/patient/followup/generate/route.ts`, `lib/cre/followup/__tests__/generator.test.ts`).
- 2026-02-19: UC2-03 Clinician-Review auf Case-Checklist-Status `captured/missing/unclear/delegated_to_physician` erweitert, inkl. zentralisierter Mapping-Utility und erweiterter Requested-Item-Vorschläge (`apps/rhythm-studio-ui/app/clinician/patient/[id]/AnamnesisSection.tsx`, `lib/cre/followup/clinicianChecklist.ts`).
- 2026-02-19: UC2-03 serverseitig gehärtet: `GET /api/clinician/patient/[patientId]/clinical-intake/latest` liefert `case_checklist`-Snapshot (`entries`, `open_loop_count`, `status_counts`), Clinician-UI nutzt primär Server-Snapshot mit Fallback; API-Route-Test ergänzt (`apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/clinical-intake/latest/route.ts`, `apps/rhythm-studio-ui/lib/fetchClinician.ts`, `apps/rhythm-studio-ui/app/clinician/patient/[id]/AnamnesisSection.tsx`, `apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/clinical-intake/latest/__tests__/route.test.ts`).
- 2026-02-19: UC2-03 Negativfall abgesichert: zusätzlicher Contract-Test bestätigt leeren `case_checklist`-Snapshot bei fehlenden Follow-up-Objectives (`apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/clinical-intake/latest/__tests__/route.test.ts`).
- 2026-02-19: UC2 abgeschlossen (v0.8 Technical Scope): ergänzende Checklist-Mapping-Regressionen (`invalid status -> unclear`, offene Loops -> Requested-Item-Suggestions) plus Abschlussmarkierung UC2-01/02/03 (`lib/cre/followup/__tests__/clinicianChecklist.test.ts`, `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-19.md`).
- 2026-02-19: UC3 gestartet (Technical Slice): blockbasierte Savepoints + `active_block_id` im Follow-up-Lifecycle implementiert sowie `ProgramReady`-Ableitung bei abgeschlossenen Blöcken ergänzt; Regressionstests erweitert (`lib/cre/followup/generator.ts`, `lib/cre/followup/schema.ts`, `lib/types/clinicalIntake.ts`, `lib/cre/followup/__tests__/generator.test.ts`).

Pflegeregel (ab sofort verbindlich):
- Jede umgesetzte Änderung mit v0.8-Impact wird direkt nach Implementierung im Change Log dieser Datei nachgetragen (Datum, kurzer Scope, optional Commit-ID).
