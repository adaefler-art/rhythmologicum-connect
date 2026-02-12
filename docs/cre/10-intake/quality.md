# Intake Quality Rules

## Rules vs Checks Traceability

Issue 10 quality rules (R-I10-1.1 .. R-I10-4.2) are defined and validated in:

- Testing guide: [ISSUE-10-TESTING-GUIDE.md](../../../ISSUE-10-TESTING-GUIDE.md)
- Validation logic: [lib/clinicalIntake/validation.ts](../../../lib/clinicalIntake/validation.ts)
- Unit tests: [lib/clinicalIntake/__tests__/validation.test.ts](../../../lib/clinicalIntake/__tests__/validation.test.ts)

## Rule Categories

- Summary language quality (no colloquial wording, minimum length)
- Structured data completeness
- Red flag formatting guidance
- Uncertainty tracking and documentation

## How to Extend

- Add new rules in [lib/clinicalIntake/validation.ts](../../../lib/clinicalIntake/validation.ts)
- Add tests alongside the rule in [lib/clinicalIntake/__tests__/validation.test.ts](../../../lib/clinicalIntake/__tests__/validation.test.ts)
- Update [ISSUE-10-TESTING-GUIDE.md](../../../ISSUE-10-TESTING-GUIDE.md) with new checks
