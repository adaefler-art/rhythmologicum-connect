[CmdletBinding()]
param(
  [string]$Repo = 'adaefler-art/rhythmologicum-connect',
  [string]$Since = '2025-12-30',
  [string]$OutDir,
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

function Write-Info([string]$msg) {
  if (-not $Quiet) { Write-Host $msg }
}

function Require-Command([string]$name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if (-not $cmd) { throw "Required command not found in PATH: $name" }
}

function Write-Json([string]$path, $obj) {
  $obj | ConvertTo-Json -Depth 20 | Out-File -Encoding utf8 -LiteralPath $path
}

function Normalize-DateKey([string]$date) {
  # Deterministic file suffix
  return ($date -replace '[^0-9-]', '')
}

function Safe-Join([string]$a, [string]$b) {
  return (Join-Path $a $b)
}

Require-Command 'gh'
Require-Command 'git'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..') | Select-Object -First 1).Path
if (-not $OutDir) {
  $OutDir = Safe-Join $repoRoot 'docs\_evidence\v0.5\github'
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$sinceKey = Normalize-DateKey $Since
$generatedAt = (Get-Date).ToString('s')

$metaPath = Safe-Join $OutDir "meta_since_${sinceKey}.json"
$issuesJsonPath = Safe-Join $OutDir "issues_updated_since_${sinceKey}.json"
$issuesCsvPath = Safe-Join $OutDir "issues_updated_since_${sinceKey}.csv"
$prsJsonPath = Safe-Join $OutDir "prs_merged_since_${sinceKey}.json"
$prsCsvPath = Safe-Join $OutDir "prs_merged_since_${sinceKey}.csv"
$linksJsonPath = Safe-Join $OutDir "issue_pr_links_since_${sinceKey}.json"
$linksCsvPath = Safe-Join $OutDir "issue_pr_links_since_${sinceKey}.csv"

Write-Info "Exporting GitHub planned surface via gh (repo=$Repo, since=$Since)"

# ------------------------------------------------------------
# Issues (created/updated) since date
# Requirement: created/updated, labels, milestone, body
# Strategy: export issues updated since date (covers created>=since as subset)
# ------------------------------------------------------------

$issueSearchUpdated = "updated:>=$Since repo:$Repo"

$issueListCmd = @(
  'gh issue list',
  '--state all',
  "--search `"$issueSearchUpdated`"",
  '--limit 500',
  '--json number,title,state,createdAt,updatedAt,labels,milestone,body,url'
) -join ' '

$issuesRaw = Invoke-Expression $issueListCmd
$issues = @()
if ($issuesRaw) {
  $issues = $issuesRaw | ConvertFrom-Json
}

# Deterministic sort
$issues = $issues | Sort-Object number

Write-Json $issuesJsonPath $issues

$issuesCsv = $issues | ForEach-Object {
  [pscustomobject]@{
    number = $_.number
    title = $_.title
    state = $_.state
    createdAt = $_.createdAt
    updatedAt = $_.updatedAt
    url = $_.url
    milestone = if ($_.milestone) { $_.milestone.title } else { '' }
    labels = if ($_.labels) { ($_.labels | ForEach-Object { $_.name } | Sort-Object) -join ';' } else { '' }
    body = $_.body
  }
}

$issuesCsv | Export-Csv -NoTypeInformation -Encoding UTF8 -LiteralPath $issuesCsvPath

# ------------------------------------------------------------
# PRs merged since date
# Requirement: mergeCommit, changed files
# Strategy: list merged PRs then enrich with pr view (files + closingIssuesReferences)
# ------------------------------------------------------------

$prSearch = "merged:>=$Since repo:$Repo"
$prListCmd = @(
  'gh pr list',
  '--state merged',
  "--search `"$prSearch`"",
  '--limit 200',
  '--json number,title,mergedAt,labels,url'
) -join ' '

$prsBaseRaw = Invoke-Expression $prListCmd
$prsBase = @()
if ($prsBaseRaw) {
  $prsBase = $prsBaseRaw | ConvertFrom-Json
}

$prsBase = $prsBase | Sort-Object number

$prsEnriched = New-Object System.Collections.Generic.List[object]
$links = New-Object System.Collections.Generic.List[object]

foreach ($pr in $prsBase) {
  $n = $pr.number
  Write-Info "Enriching PR #$n"

  $prViewCmd = @(
    'gh pr view',
    $n,
    "--repo `"$Repo`"",
    '--json number,title,mergedAt,labels,url,mergeCommit,files,changedFiles,closingIssuesReferences'
  ) -join ' '

  $prViewRaw = Invoke-Expression $prViewCmd
  if (-not $prViewRaw) { continue }
  $prView = $prViewRaw | ConvertFrom-Json

  # Normalize file list to paths (deterministic order)
  $filePaths = @()
  if ($prView.files) {
    $filePaths = $prView.files | ForEach-Object { $_.path } | Sort-Object
  }

  $labels = if ($prView.labels) { ($prView.labels | ForEach-Object { $_.name } | Sort-Object) } else { @() }
  $mergeSha = if ($prView.mergeCommit) { $prView.mergeCommit.oid } else { '' }

  $prsEnriched.Add([pscustomobject]@{
    number = $prView.number
    title = $prView.title
    mergedAt = $prView.mergedAt
    url = $prView.url
    mergeCommit = $mergeSha
    changedFiles = $prView.changedFiles
    labels = $labels
    files = $filePaths
    closingIssuesReferences = if ($prView.closingIssuesReferences) {
      $prView.closingIssuesReferences | ForEach-Object {
        [pscustomobject]@{ number = $_.number; url = $_.url }
      }
    } else {
      @()
    }
  })

  # Links Issue <-> PR (from PR side)
  if ($prView.closingIssuesReferences) {
    foreach ($ci in $prView.closingIssuesReferences) {
      $links.Add([pscustomobject]@{
        issueNumber = $ci.number
        issueUrl = $ci.url
        prNumber = $prView.number
        prUrl = $prView.url
        mergeCommit = $mergeSha
        mergedAt = $prView.mergedAt
      })
    }
  }
}

$prsFinal = $prsEnriched | Sort-Object number
Write-Json $prsJsonPath $prsFinal

$prsCsv = $prsFinal | ForEach-Object {
  [pscustomobject]@{
    number = $_.number
    title = $_.title
    mergedAt = $_.mergedAt
    url = $_.url
    mergeCommit = $_.mergeCommit
    changedFiles = $_.changedFiles
    labels = ($_.labels -join ';')
    files = ($_.files -join ';')
    closingIssues = ($_.closingIssuesReferences | ForEach-Object { $_.number } | Sort-Object) -join ';'
  }
}

$prsCsv | Export-Csv -NoTypeInformation -Encoding UTF8 -LiteralPath $prsCsvPath

$linksFinal = $links | Sort-Object issueNumber, prNumber
Write-Json $linksJsonPath $linksFinal
$linksFinal | Export-Csv -NoTypeInformation -Encoding UTF8 -LiteralPath $linksCsvPath

Write-Json $metaPath ([pscustomobject]@{
  repo = $Repo
  since = $Since
  generatedAt = $generatedAt
  counts = [pscustomobject]@{
    issues = $issues.Count
    prs = $prsFinal.Count
    issuePrLinks = $linksFinal.Count
  }
  outputs = [pscustomobject]@{
    issuesJson = (Split-Path -Leaf $issuesJsonPath)
    issuesCsv = (Split-Path -Leaf $issuesCsvPath)
    prsJson = (Split-Path -Leaf $prsJsonPath)
    prsCsv = (Split-Path -Leaf $prsCsvPath)
    linksJson = (Split-Path -Leaf $linksJsonPath)
    linksCsv = (Split-Path -Leaf $linksCsvPath)
  }
})

Write-Info "Wrote: $issuesJsonPath"
Write-Info "Wrote: $issuesCsvPath"
Write-Info "Wrote: $prsJsonPath"
Write-Info "Wrote: $prsCsvPath"
Write-Info "Wrote: $linksJsonPath"
Write-Info "Wrote: $linksCsvPath"
Write-Info "Wrote: $metaPath"
