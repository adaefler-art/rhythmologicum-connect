# Verify DB Access

This repo includes scripts to audit and verify database access patterns and determinism.

## DB access audit

```bash
npm run -s db:access-audit
npm run -s db:access-verify
```

## Determinism gates (migrations/types)

```powershell
pwsh -File scripts/verify-db-determinism.ps1
pwsh -File scripts/verify-migration-sync.ps1
```

## Related docs

- DB determinism CI flow: [../DB_DETERMINISM_CI_FLOW.md](../DB_DETERMINISM_CI_FLOW.md)
- DB deployment quickref: [../DB_DEPLOYMENT_QUICKREF.md](../DB_DEPLOYMENT_QUICKREF.md)
