# E4 QA Checkliste (CSN / Export / Monitoring)

## Ziel
Praktische Abnahme von Epic 4 in drei Bereichen:
1. Clinical Language Normalization (E4-01)
2. Export/FHIR-Abdeckung (E4-02)
3. Monitoring + Alerts (E4-04)

---

## A. Patient-Flow: CSN v1 (E4-01)

### A1 — Klarer medizinischer Turn (keine Clarification)
- Öffne `/patient/dialog`
- Antworte auf eine Follow-up-Frage mit: `Seit heute habe ich Brustschmerz und Herzrasen.`
- Erwartung:
  - Follow-up-Endpoint antwortet `success: true`
  - `data.language_normalization.detected_language` ist `de`
  - `data.language_normalization.mapped_entities` ist nicht leer
  - `data.clarification_prompt` ist `null`

### A2 — Ambiger Turn (Clarification aktiv)
- Antworte mit: `Es ist irgendwie komisch.`
- Erwartung:
  - `data.language_normalization.clarification_required = true`
  - `data.clarification_prompt` ist gesetzt
  - Die nächste Frage enthält eine Präzisierungsaufforderung

### A3 — Persistenz im Intake
- Lade den letzten Intake (`/api/patient/intake/latest`)
- Erwartung in `structured_data.language_normalization`:
  - `version` gesetzt
  - `turns` enthält Originalphrase + Mapping + Ambiguität
  - bei Ambiguität: `pending_clarifications` enthält Eintrag

---

## B. Clinician-Export: Vollständigkeit + Gate (E4-02)

### B1 — Gate-Verhalten (nicht approved)
- Intake ist `draft` oder `in_review`
- Aufruf JSON/FHIR Export-Endpunkte
- Erwartung:
  - HTTP `409`
  - Fehlerhinweis: Export requires approved sign-off

### B2 — Gate-Verhalten (approved)
- Review auf `approved` setzen
- Export JSON und FHIR erneut aufrufen
- Erwartung:
  - HTTP `200`
  - `success: true`

### B3 — JSON Export Feldabdeckung
- Prüfe im JSON Export:
  - `reasoning` vorhanden (inkl. risk/differentials/open_questions/conflicts)
  - `followup` vorhanden (inkl. lifecycle)
  - `language_normalization` vorhanden
  - `review.current.status = approved`

### B4 — FHIR-like Abdeckung
- Prüfe im FHIR Bundle:
  - `Observation` für Reasoning Risk
  - `Observation` für Safety Effective State
  - `ServiceRequest` für Follow-up-Fragen
  - `Observation` für CSN Summary

---

## C. Monitoring/Drift: CRE Monitoring API (E4-04)

### C1 — Basisabruf
- Aufruf: `/api/admin/metrics/cre-monitoring?days=7`
- Erwartung:
  - HTTP `200`
  - `metrics` enthält:
    - `cre_followup_yield`
    - `cre_upload_completion_rate`
    - `cre_hard_stop_rate`
    - `cre_review_approval_rate`
  - `alerts` Array vorhanden

### C2 — 30-Tage Fenster
- Aufruf: `/api/admin/metrics/cre-monitoring?days=30`
- Erwartung:
  - HTTP `200`
  - plausibel andere Werte als bei `days=7`

### C3 — Invalid Parameter
- Aufruf: `/api/admin/metrics/cre-monitoring?days=14`
- Erwartung:
  - HTTP `400`
  - Validation-Fehler (`days must be 7 or 30`)

### C4 — Threshold-Reaktion
- Setze in `kpi_thresholds` für einen KPI niedrige Warn-/Kritisch-Grenze
- API erneut abrufen
- Erwartung:
  - betroffener KPI mit `severity = warning` oder `critical`

---

## D. Regression-Schnellcheck
- `npm test -- lib/cre/language/__tests__/normalization.test.ts`
- `npm test -- apps/rhythm-patient-ui/app/api/patient/followup/generate/__tests__/route.test.ts`
- `npm run build:patient`
- `npm run build:studio`

Erwartung: alles grün (bekannte Design-Token-Warnungen im Build sind tolerierbar, solange Build erfolgreich ist).
