# Vercel Projects

## Patient UI

- Root Directory: apps/rhythm-patient-ui
- Uses local vercel.json in the app directory

## Verification (PowerShell)

```powershell
Invoke-WebRequest https://rhythm-patient.vercel.app/patient -MaximumRedirection 0
Invoke-WebRequest https://<ENGINE_DOMAIN>/api/health/env -MaximumRedirection 0
```
