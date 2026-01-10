[CmdletBinding()]
param(
  [string]$Since = '2025-12-30',
  [string]$RepoRoot,
  [string]$EvidenceDir,
  [string]$OutPath
)

function Normalize-DateKey([string]$date) {
  return ($date -replace '[^0-9-]', '')
}

function Get-TopAreas([string[]]$paths) {
  $areas = New-Object System.Collections.Generic.HashSet[string]

  foreach ($p in $paths) {
    if ($p -like 'app/api/*') { $null = $areas.Add('API') }
    elseif ($p -like 'app/patient/*') { $null = $areas.Add('Patient') }
    elseif ($p -like 'app/clinician/*') { $null = $areas.Add('Clinician') }
    elseif ($p -like 'app/admin/*') { $null = $areas.Add('Admin') }
    elseif ($p -like 'app/components/*') { $null = $areas.Add('UI') }
    elseif ($p -like 'lib/*') { $null = $areas.Add('Lib') }
    elseif ($p -like 'supabase/*') { $null = $areas.Add('DB') }
    elseif ($p -like 'scripts/*') { $null = $areas.Add('Scripts') }
    elseif ($p -like 'docs/*' -or $p -like '*.md') { $null = $areas.Add('Docs') }
    elseif ($p -eq 'middleware.ts') { $null = $areas.Add('Auth') }
    elseif ($p -like '*.config.*' -or $p -like 'tsconfig.json' -or $p -like 'package.json') { $null = $areas.Add('Config') }
  }

  $result = @($areas | Sort-Object)
  if ($result.Count -eq 0) { return @('Unclear') }
  return $result
}

function Escape-Md([string]$value) {
  if ($null -eq $value) { return '' }
  # Keep table stable; escape pipes/newlines
  $v = $value -replace '\|', '\\|' 
  $v = $v -replace "\r\n|\n|\r", ' '
  return $v.Trim()
}

$repoRoot = if ($RepoRoot) { $RepoRoot } else { (Resolve-Path (Join-Path $PSScriptRoot '..\\..')).Path }
$sinceKey = Normalize-DateKey $Since

$evidenceDir = if ($EvidenceDir) { $EvidenceDir } else { Join-Path $repoRoot 'docs\\_evidence\\v0.5\\github' }
$prsPath = Join-Path $evidenceDir "prs_merged_since_${sinceKey}.json"
$issuesPath = Join-Path $evidenceDir "issues_updated_since_${sinceKey}.json"
$linksPath = Join-Path $evidenceDir "issue_pr_links_since_${sinceKey}.json"

if (-not (Test-Path -LiteralPath $prsPath)) { throw "Missing: $prsPath" }
if (-not (Test-Path -LiteralPath $issuesPath)) { throw "Missing: $issuesPath" }
if (-not (Test-Path -LiteralPath $linksPath)) { throw "Missing: $linksPath" }

$prs = Get-Content -LiteralPath $prsPath -Raw -Encoding UTF8 | ConvertFrom-Json
$issues = Get-Content -LiteralPath $issuesPath -Raw -Encoding UTF8 | ConvertFrom-Json
$links = Get-Content -LiteralPath $linksPath -Raw -Encoding UTF8 | ConvertFrom-Json

# Build lookup maps
$issueByNumber = @{}
foreach ($iss in $issues) {
  $issueByNumber[[string]$iss.number] = $iss
}

$issueToPrs = @{}
foreach ($l in $links) {
  $k = [string]$l.issueNumber
  if (-not $issueToPrs.ContainsKey($k)) { $issueToPrs[$k] = New-Object System.Collections.Generic.List[object] }
  $issueToPrs[$k].Add($l)
}

$prToIssues = @{}
foreach ($l in $links) {
  $k = [string]$l.prNumber
  if (-not $prToIssues.ContainsKey($k)) { $prToIssues[$k] = New-Object System.Collections.Generic.List[object] }
  $prToIssues[$k].Add($l)
}

# PR rows
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('| Planned Item | Type | Areas | Epic | Milestone | Status | PR | Merge Commit | Changed Files | Linked Issues | Labels |')
$lines.Add('|---|---|---|---|---|---|---|---|---:|---|---|')

foreach ($pr in ($prs | Sort-Object number)) {
  $areas = (Get-TopAreas -paths $pr.files) -join ','
  $status = 'Implemented'
  $prUrl = $pr.url
  $prCell = "[#$($pr.number)]($prUrl)"

  $linked = @()
  $prKey = [string]$pr.number
  if ($prToIssues.ContainsKey($prKey)) {
    $linked = $prToIssues[$prKey] | ForEach-Object { "#$($_.issueNumber)" } | Sort-Object
  }

  $epics = @()
  $milestones = @()
  if ($prToIssues.ContainsKey($prKey)) {
    foreach ($l in $prToIssues[$prKey]) {
      $ik = [string]$l.issueNumber
      if (-not $issueByNumber.ContainsKey($ik)) { continue }
      $issue = $issueByNumber[$ik]

      $issueLabels = @()
      if ($issue.labels) { $issueLabels = $issue.labels | ForEach-Object { $_.name } }
      if (($issue.title -like 'EPIC*') -or ($issueLabels -contains 'epic')) { $epics += $issue.title }
      if ($issue.milestone -and $issue.milestone.title) { $milestones += $issue.milestone.title }
    }
  }

  $epics = $epics | Sort-Object -Unique
  $milestones = $milestones | Sort-Object -Unique

  $labels = @()
  if ($pr.labels) { $labels = $pr.labels | Sort-Object }

  $lines.Add(
    ('| {0} | PR | {1} | {2} | {3} | {4} | {5} | {6} | {7} | {8} | {9} |' -f (Escape-Md $pr.title), (Escape-Md $areas), (Escape-Md ($epics -join ', ')), (Escape-Md ($milestones -join ', ')), $status, $prCell, (Escape-Md $pr.mergeCommit), $pr.changedFiles, (Escape-Md ($linked -join ', ')), (Escape-Md ($labels -join ', ')))
  )
}

# Issues with no linked PRs
$lines.Add('')
$lines.Add('### Issues updated since date with no linked merged PR')
$lines.Add('')
$lines.Add('| Planned Item | Type | Milestone | Status | Issue | Updated At | Labels |')
$lines.Add('|---|---|---|---|---|---|---|')

foreach ($iss in ($issues | Sort-Object number)) {
  $k = [string]$iss.number
  if ($issueToPrs.ContainsKey($k)) { continue }

  $issueCell = "[#$($iss.number)]($($iss.url))"
  $labels = if ($iss.labels) { ($iss.labels | ForEach-Object { $_.name } | Sort-Object) -join ', ' } else { '' }
  $milestone = if ($iss.milestone) { $iss.milestone.title } else { '' }
  $status = if ($iss.state -eq 'CLOSED') { 'Closed (no merged PR link)' } else { 'Open/Tracked (no merged PR link)' }

  $lines.Add(
    ('| {0} | Issue | {1} | {2} | {3} | {4} | {5} |' -f (Escape-Md $iss.title), (Escape-Md $milestone), $status, $issueCell, (Escape-Md $iss.updatedAt), (Escape-Md $labels))
  )
}

$outPath = if ($OutPath) { $OutPath } else { Join-Path $repoRoot 'docs\\v0.5\\_generated_delta_table.md' }
$lines -join "`n" | Out-File -Encoding utf8 -LiteralPath $outPath

Write-Host "Wrote delta table: $outPath"
