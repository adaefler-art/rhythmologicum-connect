# Verify DB determinism: migrations apply cleanly, no drift, types are up to date
# This script is used locally to enforce migration-first discipline
# For CI, use the GitHub Actions workflow .github/workflows/db-determinism.yml

param(
    [switch]$Debug
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Starting DB determinism verification..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is available
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "   See: https://supabase.com/docs/guides/cli/getting-started" -ForegroundColor Yellow
    Write-Host "   Or: scoop install supabase" -ForegroundColor Yellow
    exit 1
}

# 1. Reset database and apply all migrations
Write-Host "📦 Resetting database and applying migrations..." -ForegroundColor Yellow
$resetArgs = @("db", "reset")
if ($Debug) {
    $resetArgs += "--debug"
}

$resetOutput = & supabase @resetArgs 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database reset failed" -ForegroundColor Red
    Write-Host $resetOutput
    exit 1
}
Write-Host "✅ Migrations applied successfully" -ForegroundColor Green
Write-Host ""

# 2. Check for schema drift
Write-Host "🔍 Checking for schema drift..." -ForegroundColor Yellow
$diffOutput = & supabase db diff --exit-code 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Schema drift detected!" -ForegroundColor Red
    Write-Host "   This means there are manual changes in the database not captured in migrations." -ForegroundColor Yellow
    Write-Host "   Fix: Create a migration to capture these changes." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Drift details:" -ForegroundColor Yellow
    Write-Host $diffOutput
    exit 1
}
Write-Host "✅ No schema drift detected" -ForegroundColor Green
Write-Host ""

# 3. Generate types and check if they're up to date
Write-Host "🔧 Generating TypeScript types..." -ForegroundColor Yellow
$typesFile = "lib\types\supabase.ts"

try {
    $typeOutput = & supabase gen types typescript --local 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Type generation command failed"
    }
    $typeOutput | Out-File -FilePath $typesFile -Encoding UTF8
} catch {
    Write-Host "❌ Type generation failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
Write-Host "✅ Types generated successfully" -ForegroundColor Green
Write-Host ""

# 4. Check if generated types match committed version
Write-Host "🔍 Checking if types are up to date..." -ForegroundColor Yellow
$gitDiffOutput = & git diff --exit-code $typesFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Generated types differ from committed version!" -ForegroundColor Red
    Write-Host "   This means the database schema changed but types weren't regenerated." -ForegroundColor Yellow
    Write-Host "   Fix: Run 'npm run db:typegen' and commit the changes." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Diff:" -ForegroundColor Yellow
    & git diff $typesFile
    exit 1
}
Write-Host "✅ Types are up to date" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 All DB determinism checks passed!" -ForegroundColor Green
Write-Host "   ✓ Migrations apply cleanly" -ForegroundColor Green
Write-Host "   ✓ No schema drift" -ForegroundColor Green
Write-Host "   ✓ Types are up to date" -ForegroundColor Green
exit 0
