# Package 2 Implementation Summary — UI Split (Studio vs Patient)

## Scope
- Split UI into two Next.js apps:
  - apps/rhythm-studio-ui (admin + clinician)
  - apps/rhythm-patient-ui (patient portal)
- Keep engine (root app) as API host and redirect proxy.
- Preserve stable URLs: /admin/**, /clinician/**, /patient/**.

## What Moved
- Admin routes moved to apps/rhythm-studio-ui/app/admin.
- Clinician routes moved to apps/rhythm-studio-ui/app/clinician.
- Patient routes moved to apps/rhythm-patient-ui/app/patient.

## Routing Stability
- Engine now redirects:
  - /admin/** and /clinician/** → STUDIO_BASE_URL
  - /patient/** → PATIENT_BASE_URL
- UI apps rewrite /api/** → ENGINE_BASE_URL
- Redirects preserve path + query and avoid logging PHI.

## Workspace Wiring
- Added Next.js configs and tsconfig per app.
- Each app depends on workspace rhythm-core and shared libs via monorepo path alias.

## How to Run
```powershell
# Engine (API + redirect proxy)
npm run dev

# Studio UI
npm run --workspace apps/rhythm-studio-ui dev

# Patient UI
npm run --workspace apps/rhythm-patient-ui dev
```

## Verification
```powershell
npm test
npm run build
npm run --workspace apps/rhythm-studio-ui build
npm run --workspace apps/rhythm-patient-ui build
```
