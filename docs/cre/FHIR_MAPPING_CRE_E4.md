# CRE Export/FHIR Mapping (E4-02)

## Scope
Diese Doku beschreibt die E4-02-Erweiterung der Exporte für:
- JSON Export (`/api/clinician/patient/{patientId}/clinical-intake/{intakeId}/export/json`)
- FHIR-like Export (`/api/clinician/patient/{patientId}/clinical-intake/{intakeId}/export/fhir`)

## Sign-off Gate
Beide Exportendpunkte sind sign-off-gated:
- Export nur bei `review.status = approved`
- Nicht-approvte Intakes liefern `409` und `export_gate_denied`
- Erfolgreiche Exporte erzeugen `export_gate_passed`

## JSON Payload Abdeckung
`ClinicalIntakeExportPayload` enthält jetzt konsistent:
- `metadata`
- `clinical_summary`
- `structured_highlights`
- `safety`
- `review`
- `attachments`
- `reasoning` (Risk, Differentials, Open Questions, Next Steps, Uncertainties, Conflicts, Safety Alignment, Adapter)
- `followup` (Next/Queue/Asked IDs/Lifecycle)
- `language_normalization` (Turns, Ambiguity, Clarification)
- `audit`

## FHIR-like Mapping (Bundle)
Zusätzlich zu Patient/Symptomen/Vitals werden jetzt exportiert:
- Reasoning-Risk als `Observation`
- Safety Effective State als `Observation`
- Follow-up Questions als `ServiceRequest` (proposal)
- CSN-Zusammenfassung als `Observation`

## Mapping-Hinweise
- FHIR-Ausgabe ist bewusst "FHIR-like" und kein vollständiges HL7-Profile-Set.
- Semantische Kerninformationen bleiben erhalten, um Interop + Audit zu ermöglichen.
- Patientenbezug bleibt pseudonymisiert (`PT-<hash>`).
