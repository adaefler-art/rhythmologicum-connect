# Rhythmologicum Connect v0.5 — Overview

Rhythmologicum Connect is a patient stress and resilience assessment platform built on Next.js (App Router) with Supabase-backed authentication and a data-driven assessment "funnel" runtime.

## Product at a glance

- **Patients** complete the stress assessment funnel and can review their own assessment history.
- **Clinicians** access aggregated patient reports and detailed assessments via a protected dashboard.

## Key architecture (v0.5)

- **Frontend:** Next.js App Router (`/app`), React, Tailwind
- **Auth:** Supabase Auth with cookie-based sessions (SSR-safe)
- **Authorization:** role-based routing (`patient`, `clinician`, `admin`)
- **Funnel system:** data-driven funnel definitions stored in the database and executed by a backend runtime
- **Operational gates:** deterministic endpoint catalog + allowlist to prevent accidental API drift

## Where to read next

- Patient journey: [PATIENT_JOURNEY.md](PATIENT_JOURNEY.md)
- Funnel system: [FUNNEL_SYSTEM.md](FUNNEL_SYSTEM.md)
- Endpoint catalog docs: [../api/ENDPOINT_CATALOG.md](../api/ENDPOINT_CATALOG.md)
- Release notes: [../releases/v0.5.md](../releases/v0.5.md)
