$ErrorActionPreference = 'Continue'

$env:NODE_ENV = 'test'
$env:E2E_BACKEND_MODE = 'mock'
$env:PATIENT_BASE_URL = 'http://127.0.0.1:3001'
$env:NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
$env:ENGINE_BASE_URL = 'http://127.0.0.1:3002'

New-Item -ItemType Directory -Force -Path 'test-results' | Out-Null

Write-Output 'PRECHECK:where-npx'
& where.exe npx
Write-Output 'PRECHECK:playwright-version'
& npx playwright --version

Write-Output 'RUN:playwright-spec'
& npx playwright test tests/e2e/patient-followup-loop.spec.ts --project=chromium --reporter=line 2>&1 | Tee-Object -FilePath test-results/pw-followup.log
$exitCode = $LASTEXITCODE

Write-Output "PLAYWRIGHT_EXIT=$exitCode"
if (Test-Path 'test-results/pw-followup.log') {
  Write-Output 'REPORT_PRESENT=1'
} else {
  Write-Output 'REPORT_PRESENT=0'
}

exit $exitCode
