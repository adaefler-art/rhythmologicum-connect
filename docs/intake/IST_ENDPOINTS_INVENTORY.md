# IST Endpoints Inventory (Patient Record + Intake)

## Scope and sources
- API inventory base: [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md)
- Route ownership notes: [docs/API_ROUTE_OWNERSHIP.md](docs/API_ROUTE_OWNERSHIP.md)
- Runtime route files (primary app): [apps/rhythm-patient-ui/app/api](apps/rhythm-patient-ui/app/api), [apps/rhythm-studio-ui/app/api](apps/rhythm-studio-ui/app/api)

## Routing notes
- `/api/*` requests are routed through the Next.js app with a rewrite rule in [vercel.json](vercel.json).
- Studio app injects build headers for `/api/*` via [apps/rhythm-studio-ui/middleware.ts](apps/rhythm-studio-ui/middleware.ts).

## Patient record endpoints (anamnesis + state)
| Endpoint | Methods | Access | Purpose | Evidence |
| --- | --- | --- | --- | --- |
| /api/patient/anamnesis | GET, POST | patient | List/create anamnesis entries | [apps/rhythm-patient-ui/app/api/patient/anamnesis/route.ts](apps/rhythm-patient-ui/app/api/patient/anamnesis/route.ts) |
| /api/patient/anamnesis/[entryId] | GET, PATCH | patient | Read/update anamnesis entry + versions | [apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/route.ts](apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/route.ts) |
| /api/patient/anamnesis/[entryId]/archive | POST | patient | Archive entry | [apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/archive/route.ts](apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/archive/route.ts) |
| /api/patient/anamnesis/[entryId]/versions | POST | patient | Entry version list | [apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/versions/route.ts](apps/rhythm-patient-ui/app/api/patient/anamnesis/[entryId]/versions/route.ts) |
| /api/patient/state | GET, POST | patient | Canonical patient state read/write | [apps/rhythm-patient-ui/app/api/patient/state/route.ts](apps/rhythm-patient-ui/app/api/patient/state/route.ts) |

## Clinician record endpoints (anamnesis + consult notes)
| Endpoint | Methods | Access | Purpose | Evidence |
| --- | --- | --- | --- | --- |
| /api/clinician/patient/[patientId]/anamnesis | GET, POST | clinician | Read/update patient anamnesis | [apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/anamnesis/route.ts](apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/anamnesis/route.ts) |
| /api/clinician/anamnesis/[entryId]/archive | POST | clinician | Archive anamnesis entry | [apps/rhythm-studio-ui/app/api/clinician/anamnesis/[entryId]/archive/route.ts](apps/rhythm-studio-ui/app/api/clinician/anamnesis/[entryId]/archive/route.ts) |
| /api/clinician/anamnesis/[entryId]/versions | POST | clinician | Entry version list | [apps/rhythm-studio-ui/app/api/clinician/anamnesis/[entryId]/versions/route.ts](apps/rhythm-studio-ui/app/api/clinician/anamnesis/[entryId]/versions/route.ts) |
| /api/clinician/consult-notes | GET, POST | clinician | Create/list consult notes | [apps/rhythm-studio-ui/app/api/clinician/consult-notes/route.ts](apps/rhythm-studio-ui/app/api/clinician/consult-notes/route.ts) |
| /api/clinician/consult-notes/[consultNoteId] | GET | clinician | Consult note detail | [apps/rhythm-studio-ui/app/api/clinician/consult-notes/[consultNoteId]/route.ts](apps/rhythm-studio-ui/app/api/clinician/consult-notes/[consultNoteId]/route.ts) |
| /api/clinician/consult-notes/[consultNoteId]/versions | GET | clinician | Consult note versions | [apps/rhythm-studio-ui/app/api/clinician/consult-notes/[consultNoteId]/versions/route.ts](apps/rhythm-studio-ui/app/api/clinician/consult-notes/[consultNoteId]/versions/route.ts) |
| /api/clinician/consult-notes/generate | POST | clinician | Generate consult note from chat | [apps/rhythm-studio-ui/app/api/clinician/consult-notes/generate/route.ts](apps/rhythm-studio-ui/app/api/clinician/consult-notes/generate/route.ts) |

## Measures + export endpoints (longitudinal outcomes)
| Endpoint | Methods | Access | Purpose | Evidence |
| --- | --- | --- | --- | --- |
| /api/patient-measures/history | GET | patient (catalog) / clinician (runtime) | Measures history with report join | [apps/rhythm-patient-ui/app/api/patient-measures/history/route.ts](apps/rhythm-patient-ui/app/api/patient-measures/history/route.ts), [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md) |
| /api/patient-measures/export | GET | patient | JSON export of measures + consents | [apps/rhythm-patient-ui/app/api/patient-measures/export/route.ts](apps/rhythm-patient-ui/app/api/patient-measures/export/route.ts), [docs/_archive_0_3/JSON_EXPORT.md](docs/_archive_0_3/JSON_EXPORT.md) |

## Assessment runtime endpoints (intake-adjacent)
| Endpoint | Methods | Access | Purpose | Evidence |
| --- | --- | --- | --- | --- |
| /api/funnels/[slug]/assessments | POST | patient | Start assessment | [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md) |
| /api/funnels/[slug]/assessments/[assessmentId] | GET | patient | Current assessment state | [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md) |
| /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId] | POST | patient | Validate step | [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md) |
| /api/funnels/[slug]/assessments/[assessmentId]/answers/save | POST | patient | Save answers | [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md) |
| /api/funnels/[slug]/assessments/[assessmentId]/complete | POST | patient | Complete assessment | [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md) |
| /api/assessment-answers/save | POST | patient | Legacy save answers | [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md) |
| /api/assessment-validation/validate-step | POST | patient | Legacy step validation | [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md) |
| /api/assessments/[id]/resume | GET | patient | Legacy resume flow | [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md) |
| /api/patient/assessments | GET | patient | Assessment history list | [apps/rhythm-patient-ui/app/api/patient/assessments/route.ts](apps/rhythm-patient-ui/app/api/patient/assessments/route.ts) |
| /api/patient/reports/latest | GET | patient | Latest report (stub) | [apps/rhythm-patient-ui/app/api/patient/reports/latest/route.ts](apps/rhythm-patient-ui/app/api/patient/reports/latest/route.ts) |

## LLM and context endpoints (record-adjacent)
| Endpoint | Methods | Access | Purpose | Evidence |
| --- | --- | --- | --- | --- |
| /api/clinician/chat | POST | clinician | Clinician chat with record context | [apps/rhythm-studio-ui/app/api/clinician/chat/route.ts](apps/rhythm-studio-ui/app/api/clinician/chat/route.ts) |
| /api/amy/chat | GET, POST | patient | Patient chat history + messages | [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md) |
| /api/mcp/context-pack | POST | system | Context pack for LLMs | [apps/rhythm-studio-ui/app/api/mcp/context-pack/route.ts](apps/rhythm-studio-ui/app/api/mcp/context-pack/route.ts) |
