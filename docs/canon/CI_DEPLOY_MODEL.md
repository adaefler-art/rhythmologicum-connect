# CI & Deploy Model (Monorepo Velocity)

## App Boundaries
- Engine: root Next.js app (API + redirects); placeholder workspace at apps/rhythm-engine.
- Studio UI: apps/rhythm-studio-ui (admin + clinician).
- Patient UI: apps/rhythm-patient-ui (patient portal).
- Core contracts: packages/rhythm-core (shared schemas + fixtures).

## Workflow Triggers
- studio-ci.yml: changes in apps/rhythm-studio-ui/** or packages/rhythm-core/**
- patient-ci.yml: changes in apps/rhythm-patient-ui/** or packages/rhythm-core/**
- engine-ci.yml: changes in apps/rhythm-engine/**, app/**, lib/**, next.config.ts, tsconfig.json, or packages/rhythm-core/**

## Independent Deploys
- Each UI can build and deploy independently because routing is isolated by paths.
- Engine remains the API host and redirect proxy for stable URLs.

## Contract Change Rules
- Changes in packages/rhythm-core trigger all dependent workflows.
- UI apps must consume contracts from rhythm-core, not local duplicates.
- Contract-breaking changes require coordinated updates across engine + UIs.

## Optional Root Gates
- Root `npm test` and `npm run build` remain available but are not required for UI-only changes.
