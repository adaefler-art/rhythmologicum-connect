# IST Docs Index (Patient Record + Intake)

## Scope
Inventory of documentation that describes patient record, intake-adjacent flows, and data export/versioning.

## Doc inventory
| Doc | Relevant claims | Evidence |
| --- | --- | --- |
| docs/api/ENDPOINT_CATALOG.md | Deterministic list of API routes and access categories (includes anamnesis, consult notes, funnels, patient-measures, amy chat). | [docs/api/ENDPOINT_CATALOG.md](docs/api/ENDPOINT_CATALOG.md) |
| docs/API_ROUTE_OWNERSHIP.md | Ownership + auth expectations for API routes (funnels runtime, consent, patient-measures export). | [docs/API_ROUTE_OWNERSHIP.md](docs/API_ROUTE_OWNERSHIP.md) |
| docs/_archive_0_3/JSON_EXPORT.md | JSON export format for patient measures + consents; names `/api/patient-measures/export`. | [docs/_archive_0_3/JSON_EXPORT.md](docs/_archive_0_3/JSON_EXPORT.md) |
| docs/_archive_0_3/B2_IMPLEMENTATION.md | `patient_measures` schema + stress report flow persists measures and export coverage. | [docs/_archive_0_3/B2_IMPLEMENTATION.md](docs/_archive_0_3/B2_IMPLEMENTATION.md) |
| docs/_archive_0_3/CLINICIAN_AUTH.md | Clinician auth flow and RLS overview for protected data access. | [docs/_archive_0_3/CLINICIAN_AUTH.md](docs/_archive_0_3/CLINICIAN_AUTH.md) |
| docs/_archive_0_3/AUTH_FLOW.md | Detailed clinician auth flow diagrams for `/clinician` route protection. | [docs/_archive_0_3/AUTH_FLOW.md](docs/_archive_0_3/AUTH_FLOW.md) |
| docs/intake/IST_DB_INVENTORY.md | Evidence-backed DB inventory for record/versioning structures. | [docs/intake/IST_DB_INVENTORY.md](docs/intake/IST_DB_INVENTORY.md) |
| docs/intake/IST_CODE_MAP.md | API + code map for read/write paths across record data. | [docs/intake/IST_CODE_MAP.md](docs/intake/IST_CODE_MAP.md) |
| docs/intake/INTAKE_BUILD_ON_EXISTING_PLAN.md | A/B/C plan for intake on top of existing data structures. | [docs/intake/INTAKE_BUILD_ON_EXISTING_PLAN.md](docs/intake/INTAKE_BUILD_ON_EXISTING_PLAN.md) |
