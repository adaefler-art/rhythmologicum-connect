# Feature Flag Fix Plan

## Findings

- Multiple interpretations: AMY_ENABLED, CHARTS_ENABLED, CLINICIAN_DASHBOARD_ENABLED, DEV_ENDPOINT_CATALOG, E73_4_RESULT_SSOT, NEW_FEATURE_ENABLED, NEXT_PUBLIC_DEV_HARNESS_ENABLED, NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED, NEXT_PUBLIC_PILOT_ENABLED, NEXT_PUBLIC_SUPABASE_ANON_KEY, PROCESSING_RESULTS_ENABLED, USAGE_TELEMETRY_ENABLED
- Client reads of non-public flags: AMY_ENABLED, CHARTS_ENABLED, DEV_FIXTURE__ASSESSMENTS, DEV_FIXTURE__QUESTIONS, DEV_QUICK_FILLS, PROCESSING_RESULTS_ENABLED
- Dev/test-only flags: none
- _ENABLED truthy usage: USAGE_TELEMETRY_ENABLED

## Actions

- Change all flag checks to use a shared helper (flagEnabled).
- Update env documentation to specify canonical values and scope.
- Add CI check to fail on mixed interpretations or client reads of non-public flags.