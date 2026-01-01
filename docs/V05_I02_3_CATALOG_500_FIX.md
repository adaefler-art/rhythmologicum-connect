# V05-I02.3 — Fix: `/api/funnels/catalog` 500 in Production

## Goal
Prevent `/api/funnels/catalog` from returning HTTP 500 for transient catalog-read failures (e.g. pillars/versions reads), while still returning non-200 for configuration, schema drift, and auth/RLS failures.

## Scope (What changed)
- Adds `x-request-id` correlation (echoes incoming header or generates one).
- Adds early env guard: missing `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` => `500 CONFIGURATION_ERROR`.
- Adds classified error handling:
  - Schema drift (missing relations/columns) => `503 SCHEMA_NOT_READY`
  - Auth/RLS/permission failures => `403 FORBIDDEN`
  - Transient/non-critical failures:
    - pillars failure => continue with `pillars: []` and everything in `uncategorized_funnels`
    - versions failure => continue with `default_version: null`
- Avoids `.in([])` by skipping the `funnel_versions` query when there are zero funnels.
- Uses deterministic ordering with tie-breakers.

## Security / Data Handling
- Endpoint still requires authentication.
- Optional service-role usage is limited to catalog metadata reads (no PHI).

## Verification (PowerShell)
Run in repo root:

- `npm ci`
- `npm test`
- `npm run build`

## Evidence
- Route logic + error taxonomy: [app/api/funnels/catalog/route.ts](app/api/funnels/catalog/route.ts)
- Typed 503 helper: [lib/api/responses.ts](lib/api/responses.ts)
- Error code enum: [lib/api/responseTypes.ts](lib/api/responseTypes.ts)
- Route-level tests: [app/api/funnels/catalog/__tests__/route.test.ts](app/api/funnels/catalog/__tests__/route.test.ts)
- Canon contract update: [docs/canon/CONTRACTS.md](docs/canon/CONTRACTS.md)
