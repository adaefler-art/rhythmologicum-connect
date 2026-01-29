# Legacy Code Quarantine Zone

**Status**: E73.6 Ghosting Framework Active  
**Purpose**: Isolation of deprecated code to prevent usage in production  
**Last Updated**: 2026-01-28

---

## ⚠️ WARNING: LEGACY CODE ZONE

This directory contains **deprecated and ghosted code** that is **NOT permitted** for use in production applications.

### What is "Ghosting"?

"Ghosting" means:
1. ✅ Code is preserved for reference and potential data recovery
2. ❌ Code cannot be imported by production code (ESLint enforcement)
3. ❌ API routes return HTTP 410 Gone
4. ✅ Database schemas are documented with drop kits
5. ✅ Full audit trail maintained

### Why Ghost Instead of Delete?

- **Compliance**: May need historical code for audit/legal purposes
- **Data Recovery**: Database schemas needed for data migration/export
- **Learning**: Shows evolution of codebase and why patterns changed
- **Rollback**: Emergency reference if ghosting was premature (rare)

---

## Directory Structure

```
legacy/
├── code/          # Archived application code (apps/rhythm-legacy)
│   ├── app/       # Legacy Next.js app routes and API handlers
│   └── ...
├── routes/        # 410 stub routes that replaced legacy endpoints
│   └── README.md  # Mapping of ghosted routes to 410 stubs
├── db/            # Database drop kit and schema documentation
│   ├── README.md  # Instructions for removing legacy tables
│   └── drop-*.sql # SQL scripts to drop legacy schemas
└── README.md      # This file
```

---

## Rules & Enforcement

### R-LEGACY-001: No Imports from Legacy

**Rule**: Production code MUST NOT import from `legacy/**` paths.

**Enforcement**:
- ESLint `no-restricted-imports` pattern: `legacy/**`
- CI: lint-gate.yml
- Violations: Build fails

**Exception**: None (no allowlist)

### R-LEGACY-002: Legacy Routes Return 410

**Rule**: All legacy API routes MUST return HTTP 410 Gone with error code.

**Enforcement**:
- Manual verification: `scripts/verify-legacy-ghosting.mjs`
- CI: TBD (future enhancement)

**Response Format**:
```json
{
  "error": "LEGACY_GHOSTED",
  "route": "/api/[original-path]",
  "message": "This endpoint has been deprecated. Please use [alternative] or contact support.",
  "deprecatedAt": "2026-01-28",
  "docsUrl": "https://docs.example.com/legacy-migration"
}
```

### R-LEGACY-003: TypeScript Ignores Legacy

**Rule**: `tsconfig.json` MUST exclude `legacy/**` from compilation.

**Enforcement**:
- TypeScript compiler
- CI: build process
- Violations: Type errors from legacy code appear in production builds

**Rationale**: Legacy code may have type errors or use deprecated patterns. We don't want these to block production builds.

---

## For Developers

### What If I Need to Reference Legacy Code?

**DON'T**: Import or copy-paste legacy code.

**DO**:
1. Review legacy code for understanding of the pattern
2. Implement the feature fresh in production code using current patterns
3. Document in PR why the new implementation differs
4. Add tests for the new implementation

### What If a Legacy Endpoint Is Still Needed?

If you discover a legacy endpoint is still in use:

1. **Verify Impact**: Check logs/monitoring for actual usage
2. **Create Issue**: Open issue with label `legacy-unghosting`
3. **Implement Properly**:
   - Write new endpoint in production app (studio-ui or patient-ui)
   - Follow current patterns (auth, validation, etc.)
   - Add tests
   - Update endpoint catalog
4. **Migrate Callsites**: Update all callers to use new endpoint
5. **Keep 410**: Leave legacy 410 route until migration is complete

### What If I Need Legacy Database Data?

See `legacy/db/README.md` for:
- Schema documentation
- Data export scripts
- Migration guides
- Drop procedures

---

## For Maintainers

### Adding a Route to Ghosting

1. **Move Code**: `mv apps/rhythm-legacy/app/api/[route] legacy/code/app/api/[route]`
2. **Create 410 Stub**: Add entry in `legacy/routes/`
3. **Update Docs**: Document in `legacy/routes/README.md`
4. **Test**: Verify 410 response manually
5. **Commit**: Use commit message format: `chore(legacy): ghost [route-name]`

### Removing Legacy Code Permanently

Only after:
- ✅ No usage in logs for 90+ days
- ✅ Legal/compliance team approval
- ✅ Data migration complete (if applicable)
- ✅ Documentation archived

Process:
1. Create issue with label `legacy-removal`
2. Get approval from lead + compliance
3. Execute DB drop scripts (if applicable)
4. Delete code from `legacy/code/`
5. Keep 410 route indefinitely (minimal cost, high value)

---

## Metrics & Status

**Ghosted Endpoints**: TBD  
**Ghosted Code Files**: ~187 TypeScript files  
**Legacy DB Tables**: TBD (documented in `legacy/db/README.md`)

**Last Audit**: 2026-01-28  
**Next Review**: 2026-04-28 (90 days)

---

## Related Documentation

- `docs/guardrails/RULES_VS_CHECKS_MATRIX.md` - Full guardrails documentation
- `docs/api/ENDPOINT_CATALOG.md` - Active endpoint catalog
- `docs/API_ROUTE_OWNERSHIP.md` - Current API ownership patterns
- `legacy/db/README.md` - Database drop kit documentation
- `legacy/routes/README.md` - Ghosted routes mapping

---

## Changelog

- **2026-01-28**: Initial ghosting framework created (E73.6)
  - Moved apps/rhythm-legacy to legacy/code
  - Created 410 stub infrastructure
  - Added ESLint enforcement
  - Created database drop kit foundation
