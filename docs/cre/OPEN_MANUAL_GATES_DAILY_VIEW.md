# Open Manual Gates — Daily View (NV2-NV5)

Stand: 2026-02-19
Zweck: 1-Seiten-Übersicht für Daily/Weekly, nur verbleibende manuelle/operative Restschritte.

## 1) Aktueller Fokus

- Ziel: v0.8 manuell/operativ abschließen, ohne weitere technische Scope-Erweiterung.
- Primärfokus diese Woche: **UC1 Clinical Entry End-to-End stabil** (Safety+Visit, inkl. Hybrid iOS auf realem Device).
- Quelle der Wahrheit: `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-19.md`

## 1b) UC1 E2E + Hybrid iOS Fokusspur

| Track | Konkreter Fokus | Owner | ETA | Status | Evidence |
|---|---|---|---|---|---|
| UC1-E2E | UC1 Journey auf Staging end-to-end (Auth/Session/Submit/Read-only) | Patient FE + QA | 2026-02-21 | _offen_ | `tests/e2e/patient-followup-loop.spec.ts` + NV2 Evidence-Run |
| UC1-iOS-1 | Blackscreen Root Cause isolieren und fixen (Startup/WebView/Redirect) | Mobile/Platform | 2026-02-20 | _offen_ | Xcode Device Logs + iOS Shell Run Notes |
| UC1-iOS-2 | iOS Device-Smoke für UC1 grün (Login→Abschluss→Relaunch Read-only) | QA Mobile | 2026-02-21 | _offen_ | `docs/cre/NV2_MANUAL_EVIDENCE_LOG_RUN_01_2026-02-17.md` |
| UC1-iOS-3 | Deep-Link `/patient/**` Stabilität in laufender Session verifizieren | Mobile/Platform + QA | 2026-02-22 | _offen_ | iOS Shell Acceptance Checklist |

## 2) Offene Manual Gates

| Bereich | Offener Gate | Owner | ETA | Status | Evidence |
|---|---|---|---|---|---|
| NV2 | A-D Manual-Checkliste vollständig durchführen | _offen_ | _offen_ | _offen_ | `docs/cre/NV2_MANUAL_EVIDENCE_LOG_RUN_01_2026-02-17.md` |
| NV2 | 0 offene P0/P1 UI-Bugs + finaler Copy-Review | _offen_ | _offen_ | _offen_ | `docs/cre/NV2_MANUAL_EVIDENCE_LOG_RUN_01_2026-02-17.md` |
| NV3 | 2-Wochen Shadow-Mode KPI-Stabilität nachweisen | _offen_ | _offen_ | _offen_ | `docs/cre/NV3_WEEKLY_MONITORING_REVIEW_TEMPLATE.md` |
| NV3 | Kein unadressierter `critical` Alert + klinisches Review | _offen_ | _offen_ | _offen_ | `docs/cre/NV3_WEEKLY_MONITORING_REVIEW_TEMPLATE.md` |
| NV4 | Klinisches Kurzreview (qualitatives UX-Feedback) dokumentieren | _offen_ | _offen_ | _offen_ | `docs/cre/NV4_KPI_COMPARISON_REPORT_01_2026-02-17.md` |
| NV5 | Formales Go/No-Go mit Risikoentscheid + Sign-off | _offen_ | _offen_ | _offen_ | `docs/cre/NV5_RELEASE_READINESS_REPORT_DRAFT.md` |

## 3) Top 5 diese Woche (Owner/ETA)

| Prio | Arbeitspaket | Primärer Owner (Rolle) | Ziel-ETA | Definition of Done | Blockiert durch |
|---|---|---|---|---|---|
| P1 | UC1-iOS-1 Blackscreen fixieren und Startup/Redirect stabilisieren | Mobile/Platform | 2026-02-20 | Start ohne Blackscreen auf Device verifiziert | Device-Logs + reproduzierbarer Testfall |
| P2 | UC1-E2E Journey auf Staging vollständig durchfahren und evidenzieren | Patient FE + QA | 2026-02-21 | Login→Dialog→Submit→Read-only als E2E-Nachweis dokumentiert | P1 abgeschlossen |
| P3 | UC1-iOS-2 Device-Smoke inkl. Relaunch Read-only grün | QA Mobile | 2026-02-21 | 1 kompletter grüner UC1 Device-Run protokolliert | P1 + Staging erreichbar |
| P4 | NV2 Manual-Run A-D + P0/P1/Copy-Signoff finalisieren | QA/UX + Product | 2026-02-22 | NV2 Manual Gates vollständig geschlossen | P2/P3 Evidenz liegt vor |
| P5 | NV5 Go/No-Go-Vorbereitung um iOS-Hybrid-Check erweitern | Product Owner | 2026-02-24 | Entscheiddoc enthält expliziten iOS-Hybrid-Gate | P1-P4 Status konsolidiert |

## 4) Daily Update Block

- Datum/Uhrzeit:
- Teilnehmer:
- Seit letztem Update erledigt:
- Neue Blocker:
- Entscheidungen heute:

## 5) Priorisierte Nächste Schritte (48h)

1. NV2 Manual-Run durchführen und Evidence-Tabelle befüllen.
2. NV3 Monitoring-Review mit echten 7d/30d Werten durchführen.
3. NV4 klinisches Kurzreview dokumentieren.
4. NV5 Go/No-Go Termin mit Sign-off vorbereiten.

## 6) Ampelstatus (Team)

- NV2 Manual: `red` / `amber` / `green`
- NV3 Operations: `red` / `amber` / `green`
- NV4 Clinical Feedback: `red` / `amber` / `green`
- NV5 Go/No-Go: `red` / `amber` / `green`
