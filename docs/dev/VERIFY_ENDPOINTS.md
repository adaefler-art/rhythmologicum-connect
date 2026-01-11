# Verify Endpoints (Endpoint Catalog Gate)

The endpoint catalog is generated deterministically from the repo and checked in CI.
The allowlist documents known, explicitly allowed exceptions (e.g. legacy/orphan endpoints).

## Generate

```bash
node scripts/dev/endpoint-catalog/generate.js --repo-root . --out-dir docs/api --allowlist docs/api/endpoint-allowlist.json
```

Or via npm script:

```bash
npm run -s api:catalog
```

## Verify (CI-equivalent)

```powershell
pwsh -File scripts/ci/verify-endpoint-catalog.ps1
```

## Success criteria

- Generator produces the same output on repeated runs with no code changes.
- `git status --porcelain` is clean after running the verify command.
