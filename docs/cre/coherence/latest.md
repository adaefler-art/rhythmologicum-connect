# Clinical Coherence Report

- Generated: 2026-02-14T21:09:59.546Z
- Mode: mock (seed reasoning config, deterministic timestamps)
- Scenarios: 10
- Passed: 10
- Failed: 0

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

## Mismatch

No mismatches detected.