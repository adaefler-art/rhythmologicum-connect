# CRE Capability Gap Map (Ist vs Soll)

Stand: 2026-02-15  
Referenz-Soll: `docs/cre/CANONICAL_SPEC_SSOT.md`

## Legende
- `done`: im Code vorhanden und nutzbar
- `partial`: vorhanden, aber unvollständig/inkonsistent
- `missing`: nicht vorhanden

## Matrix

| Capability | Status | Ist-Referenzen (Code) | Gap | Folge-Issue |
|---|---|---|---|---|
| Intake Generation | done | `apps/rhythm-patient-ui/app/api/clinical-intake/generate/route.ts` | - | - |
| Intake Latest (Patient) | done | `apps/rhythm-patient-ui/app/api/clinical-intake/latest/route.ts` | - | - |
| Intake Latest/History/Version (Clinician) | partial | `apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/clinical-intake/latest/route.ts`, `.../history/route.ts`, `.../intake/version/[versionNumber]/route.ts` | API-Envelope vorher uneinheitlich, jetzt harmonisiert; weitere Endpunkte prüfen | CRE-E1-03 |
| Safety Evaluation + Effective Policy | done | `lib/cre/safety/redFlags.ts`, `lib/cre/safety/policyEngine.ts`, `lib/cre/safety/overrideHelpers.ts` | Semantik-Tuning/FP-Reduktion offen | CRE-E2-02 |
| Red-Flag Matrix A/B/C | partial | `docs/cre/safety/SAFETY_MATRIX.md`, `lib/cre/safety/rules/*` | vollständige, final abgestimmte Matrix je Domäne fehlt | CRE-E2-01 |
| Reasoning Pack | partial | `lib/cre/reasoning/engine.ts`, `lib/cre/reasoning/configStore.ts` | Zielmodell (U/S/IG etc.) noch nicht vollständig | CRE-E3-01 |
| Follow-up Loop | partial | `lib/cre/followup/generator.ts`, `tests/e2e/patient-followup-loop.spec.ts` | harte Version- und Queue-Invarianten weiter absichern | CRE-E3-04 |
| HITL/HIC Gates | partial | Review-/Statuslogik in Intake/Review-Pfaden vorhanden | End-to-End Gate-Erzwingung für alle Nutzungspfade ausbauen | CRE-E3-03 |
| 10-W/OPQRST Pflichtstruktur | missing | - | Pflichtmodul + Validierung nicht SSOT-konform ausdefiniert | CRE-E2-03 |
| Ganzheitliche Anamnese + Completeness | missing | - | strukturierte Module + Completeness Score fehlen | CRE-E2-04 |
| Teach-Back + explizite Negativa | partial | Teile in Prompt/Flows implizit | systematisch/feldbasiert im Datenmodell fehlt | CRE-E2-05 |
| GP Domain Adapter v1 | partial | Reasoning-Konfiguration vorhanden | dedizierter GP-Adapter mit konservativem Profil fehlt | CRE-E3-02 |
| Mehrsprachigkeit / CSN | missing | - | Language+Context+Normalization Pipeline fehlt | CRE-E4-01 |
| Export JSON/PDF/FHIR Vollabdeckung | partial | Export-Routen vorhanden (`.../export/*`) | SSOT-Feldabdeckung und Konsistenz prüfen/ergänzen | CRE-E4-02 |
| Klinische Validierung I/II | missing | - | Studienprotokoll + KPI-Betrieb fehlen | CRE-E4-03 |
| Drift-/Safety-Monitoring Routine | partial | Metrik-/Telemetry-Bausteine vorhanden | regelmäßige Monitoring-Routine + Alerts fehlen | CRE-E4-04 |

## Endpoint-Inventar (E1-03 Scope)
- `POST /api/clinical-intake/generate`
- `GET /api/clinical-intake/latest`
- `GET /api/clinician/patient/[patientId]/clinical-intake/latest`
- `PATCH /api/clinician/patient/[patientId]/clinical-intake/latest`
- `GET /api/clinician/patient/[patientId]/clinical-intake/history`
- `GET /api/clinician/patient/[patientId]/intake/version/[versionNumber]`

## Ergebnis
- E1-02 ist mit dieser Matrix erfüllt.
- Alle `partial/missing` Einträge sind einem Folge-Issue zugeordnet.