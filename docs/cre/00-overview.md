# CRE Overview

Clinical Reasoning Engine (CRE) is the deterministic, auditable layer that turns patient dialogue into structured intake data, safety signals, and clinician-ready summaries. CRE is intentionally rules-first: it does not let the LLM decide safety or escalation.

## Phases

- Phase 1: Structured intake generation and quality validation.
- Phase 2: Safety red flags + escalation matrix (A/B/C) and patient hard-stop.
- Phase 2.1: Traceable rule IDs and deterministic safety rules scaffolding.
- Phase 3+: Future expansion for additional domain rules and operational checks.

## CRE Is

- A rules-based, auditable decision layer.
- The single place where intake data quality and safety logic live.
- Deterministic and testable with fixed inputs.

## CRE Is Not

- A diagnosis engine.
- A replacement for clinician review.
- A safety oracle based on LLM outputs.

## Planning

- Current implementation and delivery roadmap: `ROADMAP_POST_E4_2026-02-15.md`
- Use-case reference (UC1/UC2/UC3, verbindlicher Scope): `USE_CASE_REFERENCE_2026-02-17.md`
- Rollout use-case plan (Umsetzungssequenz): `ROLLOUT_USE_CASE_PLAN_2026-02-17.md`
