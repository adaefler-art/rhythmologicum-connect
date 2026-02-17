# NV2 Manual Evidence Log Template

Stand: 2026-02-17

Zweck:
- Nachweisstruktur fuer die offenen NV2-Exit-Gates.
- Verbindet manuelle Testdurchfuehrung mit klarer Evidence, Owner und Abschlussentscheid.

Scope:
- Patient Dialog (`/patient/dialog`)
- Testfaelle A-01 bis D-04 aus `docs/cre/PATIENT_DIALOG_NV2_MANUAL_TEST_CHECKLIST.md`

## 1) Run-Metadaten

- Run-ID:
- Datum/Uhrzeit:
- Testumgebung (local/staging/preview):
- Build/Commit:
- Durchfuehrende Person:
- Rolle (Med/BE/QA/Product):

## 2) Ergebnis-Matrix (A-01 bis D-04)

| Testfall | Ergebnis (`ok`/`abweichung`) | Severity (`P0/P1/P2`) | Evidence-Link | Kurznotiz |
|---|---|---|---|---|
| A-01 | _offen_ | _offen_ | _offen_ | _offen_ |
| A-02 | _offen_ | _offen_ | _offen_ | _offen_ |
| A-03 | _offen_ | _offen_ | _offen_ | _offen_ |
| A-04 | _offen_ | _offen_ | _offen_ | _offen_ |
| B-01 | _offen_ | _offen_ | _offen_ | _offen_ |
| B-02 | _offen_ | _offen_ | _offen_ | _offen_ |
| B-03 | _offen_ | _offen_ | _offen_ | _offen_ |
| B-04 | _offen_ | _offen_ | _offen_ | _offen_ |
| C-01 | _offen_ | _offen_ | _offen_ | _offen_ |
| C-02 | _offen_ | _offen_ | _offen_ | _offen_ |
| C-03 | _offen_ | _offen_ | _offen_ | _offen_ |
| C-04 | _offen_ | _offen_ | _offen_ | _offen_ |
| D-01 | _offen_ | _offen_ | _offen_ | _offen_ |
| D-02 | _offen_ | _offen_ | _offen_ | _offen_ |
| D-03 | _offen_ | _offen_ | _offen_ | _offen_ |
| D-04 | _offen_ | _offen_ | _offen_ | _offen_ |

## 3) P0/P1 Defect Register (nur offen)

| Defect-ID | Kategorie | Severity | Symptom | Repro-Schritte | Owner | ETA |
|---|---|---|---|---|---|---|
| _offen_ | _UI/Copy/Flow_ | _P0/P1_ | _offen_ | _offen_ | _offen_ | _offen_ |

## 4) NV2 Exit-Kriterien Check

- [ ] 100% definierte UX-States in manuellen Testfaellen abgedeckt
- [ ] 0 offene P0/P1 UI-Bugs im Patient-Dialog
- [ ] Kein kritischer Copy-Bruch in Kernuebergaengen
- [ ] E2E-Smoke Kernpfad in 3 konsekutiven Laeufen stabil (Referenzrun verlinkt)

## 5) Abschlussentscheidung

- NV2-Statusvorschlag: `offen` / `in Arbeit` / `erledigt`
- Begruendung:
- Rest-Risiken:

## 6) Sign-off

- QA:
- Medical:
- Backend:
- Product:

## Verknuepfte Artefakte

- `docs/cre/PATIENT_DIALOG_NV2_MANUAL_TEST_CHECKLIST.md`
- `docs/cre/PATIENT_DIALOG_UX_STATE_CATALOG_NV2.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`
