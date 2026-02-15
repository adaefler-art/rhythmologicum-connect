# Rules vs Checks Matrix — Assistant Identity Configuration

## Overview

This document maps each rule defined in `/docs/ASSISTANT_IDENTITY_RULES.md` to its corresponding check implementation. Every rule MUST have at least one check, and every check MUST reference at least one rule ID.

**Guardrail Principle**: If a rule exists without a check, or a check exists without a rule, the system is incomplete and risks configuration drift.

## Matrix

| Rule ID | Rule Description | Check Script | Check Function | Status | Notes |
|---------|------------------|--------------|----------------|--------|-------|
| **R-001** | Single Source of Truth | `check-assistant-config.mjs` | Verifies ASSISTANT_CONFIG import usage | ✅ Implemented | Scans for hard-coded names vs config usage |
| **R-002** | UI Components Must Use Config | `check-assistant-config.mjs` | Scans `.tsx`, `.ts` files for hard-coded names | ✅ Implemented | Reports violations with line numbers |
| **R-003** | LLM Prompts Must Use Config | `check-assistant-config.mjs` | Global scan covers prompt files | ✅ Implemented | Includes `/lib/llm/prompts.ts` |
| **R-004** | Documentation Must Reference Config | `check-assistant-config.mjs` | Warns about hard-coded names in `/docs` | ⚠️ Warning Only | Non-blocking, manual review recommended |
| **R-005** | Comments May Reference Historical Names | N/A (Manual Review) | Allows "AMY" in comments with "backward compatibility" | ✅ Implemented | Check script ignores compat comments |
| **R-006** | API Routes and DB Names Exempted | `check-assistant-config.mjs` | Exempts `/api/amy/*`, migrations, legacy code | ✅ Implemented | Explicit exemption list |

## Diff Report

### Rules Without Checks
*None* — All rules have corresponding check implementations or are marked as manual review.

### Checks Without Rules
*None* — All checks reference specific rule IDs.

### Scope Mismatches
*None* — Check script scope matches rule definitions.

## See Also

- `/docs/ASSISTANT_IDENTITY_RULES.md` - Full rule definitions
- `/lib/config/assistant.ts` - Configuration source of truth
- `/scripts/ci/check-assistant-config.mjs` - Check implementation
- `/RULES_VS_CHECKS_MATRIX_DESIGN.md` - Design recovery matrix (separate concern)

---

**Last Updated**: 2026-02-08  
**Maintained By**: Development Team  
**Review Frequency**: On every assistant identity change or rule addition
