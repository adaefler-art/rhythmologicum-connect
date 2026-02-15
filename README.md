# Rhythmologicum Connect

A Next.js + Supabase platform for patient stress/resilience intake, clinician review workflows, and CRE safety/monitoring operations.

Status: **v0.7 released · v0.8 in execution**

## Docs (current)

- Overview: [docs/overview/README.md](docs/overview/README.md)
- Release status: [docs/releases/CURRENT.md](docs/releases/CURRENT.md)
- v0.7 release notes: [docs/releases/v0.7.md](docs/releases/v0.7.md)
- v0.8 execution checklist: [docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md](docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md)
- Dev setup: [docs/dev/DEV_SETUP.md](docs/dev/DEV_SETUP.md)
- Verify endpoints: [docs/dev/VERIFY_ENDPOINTS.md](docs/dev/VERIFY_ENDPOINTS.md)
- **Funnel System (E74):** [docs/funnels/README.md](docs/funnels/README.md) - Canonical schema, validation, publishing
- **Rules vs Checks Matrix:** [docs/matrices/RULES_VS_CHECKS_MATRIX.md](docs/matrices/RULES_VS_CHECKS_MATRIX.md) - Complete rule-check alignment

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open http://localhost:3000.

## Verification

```bash
npm test
npm run build
```

Guardrails (critical API + Vercel root + Jest):

```bash
npm run verify
```

```bash
npm run -s api:catalog
pwsh -File scripts/ci/verify-endpoint-catalog.ps1
```

## Docs archive

Historical one-off docs that used to live in the repo root were moved to [docs/_archive/root](docs/_archive/root).
