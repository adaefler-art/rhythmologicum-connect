# Rhythmologicum Connect

A patient stress and resilience assessment platform with role-based access control.

Status: **v0.5 released (pending tag v0.5.0)**

## Docs (v0.5)

- Overview: [docs/overview/README.md](docs/overview/README.md)
- Release notes: [docs/releases/v0.5.md](docs/releases/v0.5.md)
- Dev setup: [docs/dev/DEV_SETUP.md](docs/dev/DEV_SETUP.md)
- Verify endpoints: [docs/dev/VERIFY_ENDPOINTS.md](docs/dev/VERIFY_ENDPOINTS.md)

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

```bash
npm run -s api:catalog
pwsh -File scripts/ci/verify-endpoint-catalog.ps1
```

## Docs archive

Historical one-off docs that used to live in the repo root were moved to [docs/_archive/root](docs/_archive/root).
