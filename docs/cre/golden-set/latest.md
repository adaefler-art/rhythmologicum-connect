# CRE Golden Set Report

- Generated: 2026-02-17T14:10:38.422Z
- Mode: mock (seed reasoning config, deterministic timestamps)
- Scenarios: 30
- Passed: 30
- Failed: 0

## KPI Summary

- golden_set_pass_rate: 1
- followup_repeat_question_rate: 0
- objective_reask_violation_count: 0

## Scenario Matrix

| Scenario | Expected | Actual | Status |
|---|---|---|---|
| S01 Anxiety/Panic with palpitations (no A) | Safety n/a/none | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S02 Chest pain negated (no A) | Safety n/a/none | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S03 Suicidal ideation negated (must never be A) | Safety n/a/n/a | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S04 Passive suicidal ideation (B / needs review, no hard stop) | Safety B/warn | Safety B/warn<br>Review n/a<br>PDF ok | ✅ |
| S05 Active intent + plan + means (A/hard_stop with verified evidence) | Safety A/hard_stop | Safety A/hard_stop<br>Review n/a<br>PDF ok | ✅ |
| S06 needs_more_info -> patient answers -> re-gen -> approve | Safety n/a/n/a<br>Review approved | Safety n/a/none<br>Review approved<br>PDF ok | ✅ |
| S07 Upload required -> request_more_info creates clinician follow-up | Safety n/a/n/a<br>Review needs_more_info | Safety n/a/none<br>Review needs_more_info<br>PDF ok | ✅ |
| S08 Override set -> export/audit consistency | Safety C/require_confirm | Safety C/require_confirm<br>Review n/a<br>PDF ok | ✅ |
| S09 Chest pain >=20 minutes with qualifying evidence (A/hard_stop) | Safety A/hard_stop | Safety A/hard_stop<br>Review n/a<br>PDF ok | ✅ |
| S10 Multiple uncertainties -> C-level safety questions + follow-up | Safety C/warn | Safety C/warn<br>Review n/a<br>PDF ok | ✅ |
| S11 Medication negative short answer (nein) should not produce duplicate follow-up questions | Safety n/a/n/a | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S12 Medication negative typo variant (nei) should not produce duplicate follow-up questions | Safety n/a/n/a | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S13 Medication negative variant (nope) should not produce duplicate follow-up questions | Safety n/a/n/a | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S14 Stress + Schlafmangel with clarification should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S15 Palpitations with caffeine context should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S16 Dizziness with uncertain onset should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S17 Mild anxiety with breathing discomfort should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S18 Fatigue with shift work context should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S19 Stress-related headache pattern should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S20 Evening restlessness should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S21 Concentration drop under workload should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S22 Medication none stated explicitly should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S23 Exercise-triggered palpitations should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S24 Sleep-onset insomnia should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S25 Early-morning awakening should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S26 Workday anxiety and tension should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S27 Low mood with social withdrawal should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S28 Digestive stress complaints should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S29 Weekend headache relief pattern should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |
| S30 Caregiver strain with exhaustion should keep follow-up deduplicated | - | Safety n/a/none<br>Review n/a<br>PDF ok | ✅ |

## Mismatch

No mismatches detected.