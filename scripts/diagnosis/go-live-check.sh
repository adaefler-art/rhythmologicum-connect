#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

fail() {
  echo "❌ $1" >&2
  exit 1
}

check_file() {
  local path="$1"
  if [[ ! -f "${ROOT_DIR}/${path}" ]]; then
    fail "Missing required file: ${path}"
  fi
}

check_grep() {
  local path="$1"
  local pattern="$2"
  local label="$3"
  if ! grep -q "$pattern" "${ROOT_DIR}/${path}"; then
    fail "Missing ${label} in ${path}"
  fi
}

echo "Running E76 diagnosis go-live checks..."

ROUTE_FILES=(
  "apps/rhythm-studio-ui/app/api/mcp/route.ts"
  "apps/rhythm-studio-ui/app/api/mcp/context-pack/route.ts"
  "apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts"
  "apps/rhythm-studio-ui/app/api/studio/diagnosis/execute/route.ts"
  "apps/rhythm-studio-ui/app/api/studio/diagnosis/prompt/route.ts"
  "apps/rhythm-studio-ui/app/api/studio/diagnosis/health/route.ts"
  "apps/rhythm-studio-ui/app/api/studio/diagnosis/runs/[runId]/artifact/route.ts"
  "apps/rhythm-studio-ui/app/api/clinician/patient/[patientId]/diagnosis/runs/route.ts"
  "apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/route.ts"
  "apps/rhythm-patient-ui/app/api/patient/diagnosis/runs/[runId]/artifact/route.ts"
)

CONTRACT_FILES=(
  "lib/contracts/diagnosis.ts"
  "lib/contracts/diagnosis-prompt.ts"
)

MIGRATION_FILES=(
  "supabase/migrations/20260204104959_e76_4_diagnosis_runs_and_artifacts.sql"
  "supabase/migrations/20260204142315_e76_6_diagnosis_patient_rls.sql"
  "supabase/migrations/20260204150200_e76_7_diagnosis_rls_audit.sql"
  "supabase/migrations/20260204164641_e76_8_add_inputs_meta.sql"
)

for path in "${ROUTE_FILES[@]}"; do
  check_file "$path"
done

for path in "${CONTRACT_FILES[@]}"; do
  check_file "$path"
done

for path in "${MIGRATION_FILES[@]}"; do
  check_file "$path"
done

ENV_FILE=".env.example"
ENV_KEYS=(
  "NEXT_PUBLIC_FEATURE_MCP_ENABLED"
  "MCP_SERVER_URL"
  "NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED"
  "NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED"
  "NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED"
  "NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED"
)

for key in "${ENV_KEYS[@]}"; do
  check_grep "$ENV_FILE" "$key" "env key ${key}"
done

check_grep "supabase/migrations/20260204104959_e76_4_diagnosis_runs_and_artifacts.sql" "diagnosis_runs" "diagnosis_runs table"
check_grep "supabase/migrations/20260204104959_e76_4_diagnosis_runs_and_artifacts.sql" "diagnosis_artifacts" "diagnosis_artifacts table"

check_grep "supabase/migrations/20260204142315_e76_6_diagnosis_patient_rls.sql" "diagnosis_runs_patient_read" "patient RLS policy for diagnosis_runs"
check_grep "supabase/migrations/20260204142315_e76_6_diagnosis_patient_rls.sql" "diagnosis_artifacts_patient_read" "patient RLS policy for diagnosis_artifacts"

check_grep "supabase/migrations/20260204150200_e76_7_diagnosis_rls_audit.sql" "diagnosis_runs_clinician_assigned_read" "assigned clinician policy for diagnosis_runs"
check_grep "supabase/migrations/20260204150200_e76_7_diagnosis_rls_audit.sql" "diagnosis_artifacts_clinician_assigned_read" "assigned clinician policy for diagnosis_artifacts"
check_grep "supabase/migrations/20260204150200_e76_7_diagnosis_rls_audit.sql" "trigger_diagnosis_runs_audit" "audit trigger for diagnosis_runs"
check_grep "supabase/migrations/20260204150200_e76_7_diagnosis_rls_audit.sql" "trigger_diagnosis_artifacts_audit" "audit trigger for diagnosis_artifacts"

check_grep "supabase/migrations/20260204164641_e76_8_add_inputs_meta.sql" "inputs_meta" "inputs_meta column"

echo "✅ All E76 diagnosis go-live checks passed."
