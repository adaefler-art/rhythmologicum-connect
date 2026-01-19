# Vercel Projects

## Patient UI

- Root Directory: apps/rhythm-patient-ui
- Uses local vercel.json in the app directory

### Required env (Patient UI)

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- ENGINE_BASE_URL

## Studio UI

### Required env (Studio UI)

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- ENGINE_BASE_URL

## Verification (PowerShell)

```powershell
Invoke-WebRequest https://rhythm-patient.vercel.app/patient -MaximumRedirection 0
Invoke-WebRequest https://<ENGINE_DOMAIN>/api/health/env -MaximumRedirection 0
```

## API env gating

- API env validation runs inside each route handler (Node runtime).
- Do not enforce env validation in middleware (Edge runtime).
