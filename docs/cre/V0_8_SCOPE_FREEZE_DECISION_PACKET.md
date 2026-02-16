# v0.8 Scope-Freeze Decision Packet

Stand: 2026-02-16

Zweck:
- Entscheidungsgrundlage für Scope-Freeze (NV1-NV5) zwischen Med, BE und Product.
- Trennung zwischen "must-have für v0.8" und "post-v0.8 backlog".

## 1) Entscheidungsrahmen

- Entscheidungstermin:
- Teilnehmer (Med/BE/Product):
- Beschlussstatus: `offen` / `beschlossen`

## 2) Scope-Grid (NV1-NV5)

| Bereich | Muss in v0.8 | Kann nach v0.8 | Begründung |
|---|---|---|---|
| NV1 (Golden Set) | 30+ stabile Fälle, KPI-Report | Ausbau >30 auf 40-50 | Qualitätsbasis für Gate |
| NV2 (Patient UX/UI) | Kernpfad stabil + manuelle Restfälle abgearbeitet | Nice-to-have UX-Polish | Patientensicherheit/Bedienbarkeit |
| NV3 (Shadow Mode) | Runbook + Weekly Routine + initiale Kalibrierung | Vollständige 2-Wochen-Stabilität-Optimierung | Pilotfähigkeit |
| NV4 (Refinement) | Kernlogik aktiv + KPI-Hooks | Tiefere Tuning-Wellen | bereits weitgehend umgesetzt |
| NV5 (Readiness) | Readiness-Report + Go/No-Go + Rollback-Plan | Erweiterte Release-Automation | Release-Gate |

## 3) Offene Scope-Entscheidungen

| Thema | Option A | Option B | Entscheidung | Owner |
|---|---|---|---|---|
| Golden-Set Umfang | 30 fix | 40-50 vor Gate | _offen_ | _offen_ |
| NV2 manuelle Abdeckung | Vollständig vor NV3 Exit | gestaffelt bis NV5 | _offen_ | _offen_ |
| NV3 Volumen-Ramp | konservativ | aggressiv | _offen_ | _offen_ |

## 4) Freeze-Regeln

- Nach Freeze nur Änderungen mit dokumentiertem Risiko-/Nutzenentscheid.
- Jeder Scope-Zuwachs braucht:
  - medizinische Freigabe
  - technischen Impact-Check
  - Termin-/Risikoauswirkung auf v0.8

## 5) Sign-off

- Medical Lead:
- Backend Lead:
- Product Owner:

## 6) Referenzen

- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`
- `docs/cre/V0_8_KPI_BASELINE_SNAPSHOT_2026-02-16.md`
- `docs/cre/NV5_RELEASE_READINESS_REPORT_DRAFT.md`
