# UC1 Manual Test Catch-up Runbook (Stand 2026-02-19)

Zweck:
- Offene manuelle UC1- und NV2/NV3/NV5-Gates aus der alten Checkliste (`V0_8_EXECUTION_CHECKLIST_2026-02-15.md`) konsolidiert nachziehen.
- Klar trennen zwischen **manuell verpflichtend** und **automatisch bereits/zusätzlich abgesichert**.

Referenzen:
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-19.md`
- `docs/cre/OPEN_MANUAL_GATES_DAILY_VIEW.md`
- `docs/cre/PATIENT_DIALOG_NV2_MANUAL_TEST_CHECKLIST.md`
- `docs/cre/NV2_MANUAL_EVIDENCE_LOG_RUN_01_2026-02-17.md`

## 1) Verbindlich offene manuelle Nachtests (aus Alt-Checklist)

### A) UC1 Staging + reale Sessions
- [ ] Staging-Lauf mit realem Auth-/Session-Verhalten dokumentiert
- [ ] API-Latenz-/Retry-Verhalten als Evidence erfasst
- [ ] Evidence in `NV2_MANUAL_EVIDENCE_LOG_RUN_01_2026-02-17.md` oder Folge-Run verlinkt

### B) UC1 iOS Device-Nachweise
- [ ] Device-Log-Evidence (Xcode Console) für Startup/Session in Evidence-Run referenziert
- [ ] Device-Smoke komplett: Login → Start → Dialog → Follow-up → Abschluss → Read-only nach Relaunch
- [ ] Deep-Link `/patient/**` setzt Journey stabil fort
- [ ] iOS-Go/No-Go-Gate in `OPEN_MANUAL_GATES_DAILY_VIEW.md` final mit Owner/ETA/Status dokumentiert

### C) NV2 manuelle Restpunkte (A-D)
- [ ] Voice (A-01 bis A-04) abgearbeitet
- [ ] Netzwerk/Retry (B-01 bis B-04) abgearbeitet
- [ ] Accessibility (C-01 bis C-04) abgearbeitet
- [ ] Copy/Language (D-01 bis D-04) abgearbeitet
- [ ] 0 offene P0/P1 UI-Abweichungen bestätigt

### D) NV3/NV4/NV5 operative manuelle Gates
- [ ] NV3: 2-Wochen-KPI-Stabilität mit realem Fallvolumen nachgewiesen
- [ ] NV3: kein unadressierter `critical` Alert + klinisches Review dokumentiert
- [ ] NV4: klinisches Kurzreview als Evidence ergänzt
- [ ] NV5: formales Go/No-Go mit Risikoentscheid + Sign-off durchgeführt

## 2) Bereits automatisiert (Status 2026-02-19)

- [x] UC1 Kernjourney (Mock): `tests/e2e/patient-followup-loop.spec.ts`
- [x] Start/CTA + Fastpass Navigation: `tests/e2e/patient-intake-start-cta.spec.ts`
- [x] UC1 Safety-Routing alle 4 Pfade (Mock): `tests/e2e/patient-safety-gate-support.spec.ts`
- [x] VisitPreparation-Builder Unit-Tests: `lib/clinicalIntake/__tests__/visitPreparation.test.ts`

## 3) Zusätzliche Automatisierung (neu ergänzt)

- [x] API-Route-Test für `GET /api/patient/intake/latest` inkl. `visit_preparation` Mapping:
  - `apps/rhythm-patient-ui/app/api/patient/intake/latest/__tests__/route.test.ts`

## 4) Nicht automatisierbar in dieser Laufumgebung

Diese Punkte bleiben manuell/device-basiert:
- iOS Device-Smoke inkl. Relaunch/Deep-Link
- Xcode Device Logs als Evidence
- Staging-Run mit realen Netzwerk-/Session-Eigenschaften
- Klinisches Kurzreview + formale Go/No-Go Sign-offs

## 5) Durchführungsvorschlag (48h)

1. [ ] Staging UC1 Run durchführen (Web) und Evidence loggen
2. [ ] iOS Device-Smoke + Deep-Link evidenzieren (Video + Xcode Logs)
3. [ ] NV2 Manual Checklist A-D vollständig abhaken
4. [ ] `OPEN_MANUAL_GATES_DAILY_VIEW.md` Ampel/Owner/ETA aktualisieren
5. [ ] NV5 Entscheidungsmeeting vorbereiten (nur wenn 1-4 erfüllt)