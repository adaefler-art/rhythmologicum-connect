# v0.6 Release Notes

**Status:** Ready for closeout

## Scope
- Stabilisierung der Studio/Patient UIs (kein Redirect-Loop, klare Login-Flows).
- Deterministische Version-Informationen via `/version.json` pro App.
- Admin/Studio: aufgeräumte Navigation + Dev-Hilfeseite (Endpoint Catalog).
- Fehlertolerante Guards (kein harter SSR-Crash bei fehlender Session).

## Versioning
- Version: v0.6
- Commit: v0.6 (tag)
- GeneratedAt: see `/version.json`

## Deploy URLs
- Patient: PATIENT_BASE_URL
- Studio: STUDIO_BASE_URL
- Engine/API: ENGINE_BASE_URL

## Known Limits
- Dev-Tools (Endpoint Catalog) sind nur sichtbar, wenn `DEV_ENDPOINT_CATALOG=1` gesetzt ist.
- `public/version.json` ist build-generiert und sollte nicht manuell editiert werden.

## Changes (high level)
- Version-Info Script erweitert (per-App Output + v0.6 Schema).
- Studio Admin Navigation gestrafft (keine experimentellen Links).
- Endpoint Catalog zeigt Version/Commit/Links.
