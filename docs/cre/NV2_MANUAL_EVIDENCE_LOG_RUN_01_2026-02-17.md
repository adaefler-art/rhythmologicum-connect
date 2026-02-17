# NV2 Manual Evidence Log — Run 01

Stand: 2026-02-17
Template: `docs/cre/NV2_MANUAL_EVIDENCE_LOG_TEMPLATE.md`

## 1) Run-Metadaten

- Run-ID: `NV2-RUN-01-2026-02-17`
- Datum/Uhrzeit: `2026-02-17 _offen_`
- Testumgebung (local/staging/preview): `local`
- Build/Commit: `_offen_`
- Durchfuehrende Person: `_offen_`
- Rolle (Med/BE/QA/Product): `_offen_`

## 2) Ergebnis-Matrix (A-01 bis D-04)

| Testfall | Ergebnis (`ok`/`abweichung`) | Severity (`P0/P1/P2`) | Evidence-Link | Kurznotiz |
|---|---|---|---|---|
| A-01 | _offen_ | _offen_ | _offen_ | Mikrofon-Start visuell pruefen |
| A-02 | _offen_ | _offen_ | _offen_ | Mikrofon-Stopp ohne UI-Haenger |
| A-03 | _offen_ | _offen_ | _offen_ | Diktatfehler-Text verstaendlich |
| A-04 | _offen_ | _offen_ | _offen_ | Diktattext editierbar |
| B-01 | _offen_ | _offen_ | _offen_ | API-Fehler-Rueckmeldung klar |
| B-02 | _offen_ | _offen_ | _offen_ | Retry ohne Doppelversand |
| B-03 | _offen_ | _offen_ | _offen_ | Follow-up-Verzoegerung ohne Dead-End |
| B-04 | _offen_ | _offen_ | _offen_ | Reload nach Fehler konsistent |
| C-01 | _offen_ | _offen_ | _offen_ | Fokusreihenfolge sinnvoll |
| C-02 | _offen_ | _offen_ | _offen_ | Keyboard-only nutzbar |
| C-03 | _offen_ | _offen_ | _offen_ | Zugaengliche Beschriftung vorhanden |
| C-04 | _offen_ | _offen_ | _offen_ | Safety-Hinweis eindeutig |
| D-01 | _offen_ | _offen_ | _offen_ | "Frage"-Terminologie konsistent |
| D-02 | _offen_ | _offen_ | _offen_ | Kliniker-Hinweis neutral |
| D-03 | _offen_ | _offen_ | _offen_ | Keine redundanten Prompt-Praefixe |
| D-04 | _offen_ | _offen_ | _offen_ | Kritische Hinweise klar formuliert |

## 3) P0/P1 Defect Register (nur offen)

| Defect-ID | Kategorie | Severity | Symptom | Repro-Schritte | Owner | ETA |
|---|---|---|---|---|---|---|
| _offen_ | _UI/Copy/Flow_ | _P0/P1_ | _offen_ | _offen_ | _offen_ | _offen_ |

## 4) NV2 Exit-Kriterien Check

- [ ] 100% definierte UX-States in manuellen Testfaellen abgedeckt
- [ ] 0 offene P0/P1 UI-Bugs im Patient-Dialog
- [ ] Kein kritischer Copy-Bruch in Kernuebergaengen
- [~] E2E-Smoke Kernpfad in 3 konsekutiven Laeufen stabil (Mock-Mode bereits dokumentiert)

## 5) Vorbefuellte Referenz-Evidenz (automatisiert)

- E2E Follow-up Kernpfad stabilisiert: `tests/e2e/patient-followup-loop.spec.ts`
- Letzter dokumentierter Stand laut Checklist:
  - Selector-Haertung (`.first()`), Back/Reload-Pfad und Mobile-Readiness gruen
  - Mock-Mode Runs dokumentiert (4 passed / 1 skipped)

## 6) Abschlussentscheidung

- NV2-Statusvorschlag: `in Arbeit`
- Begruendung: Automatisierte Kernpfad-Evidenz vorhanden, manuelle Gates A-D noch offen.
- Rest-Risiken: Voice-/Accessibility-/Copy-Qualitaet noch nicht final signiert.

## 7) Sign-off

- QA: `_offen_`
- Medical: `_offen_`
- Backend: `_offen_`
- Product: `_offen_`

## Verknuepfte Artefakte

- `docs/cre/PATIENT_DIALOG_NV2_MANUAL_TEST_CHECKLIST.md`
- `docs/cre/PATIENT_DIALOG_UX_STATE_CATALOG_NV2.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`
