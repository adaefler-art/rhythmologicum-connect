# Vercel Projects

## Patient UI

- Root Directory: apps/rhythm-patient-ui
- Uses local vercel.json in the app directory

### Required env (Patient UI)

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- ENGINE_BASE_URL

### Required routes (Patient UI)

- /patient
- /datenschutz
- /impressum

### /api serving (Patient UI)

- /api/** is rewritten to ENGINE_BASE_URL (see next.config.ts)

### Auth/role redirect authority (Patient UI)

- Patient app handles patient auth flow on its own domain.
- Engine handles /patient redirects on root domain.

## Studio UI

### Required env (Studio UI)

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- ENGINE_BASE_URL

### Required routes (Studio UI)

- /admin
- /datenschutz
- /impressum

### /api serving (Studio UI)

- /api/** is rewritten to ENGINE_BASE_URL (see next.config.ts)

### Auth/role redirect authority (Studio UI)

- Studio app handles clinician/admin UI on its own domain.
- Engine handles /admin and /clinician redirects on root domain.

## Engine (root app)

### Required env (Engine)

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- ENGINE_BASE_URL

### Required routes (Engine)

- /api/test/correlation-id (200)
- /api/health/env (200 when authenticated; 401/403 otherwise)

### /api serving (Engine)

- /api/** served by engine (root Next.js app)

### Auth/role redirect authority (Engine)

- Engine is authoritative for /admin, /clinician, /patient redirects on root domain.

## Verification (PowerShell)

```powershell
Invoke-WebRequest https://rhythm-patient.vercel.app/patient -MaximumRedirection 0
Invoke-WebRequest https://<ENGINE_DOMAIN>/api/health/env -MaximumRedirection 0
pwsh -File scripts/verify-deploy-smoke.ps1 -PatientBaseUrl https://rhythm-patient.vercel.app -StudioBaseUrl https://rhythm-studio.vercel.app -EngineBaseUrl https://<ENGINE_DOMAIN>
```

## API env gating

- API env validation runs inside each route handler (Node runtime).
- Do not enforce env validation in middleware (Edge runtime).
