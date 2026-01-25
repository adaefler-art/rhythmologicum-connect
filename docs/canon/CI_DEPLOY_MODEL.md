# CI & Deploy Model (Monorepo Velocity)

## App Boundaries
- Engine: root Next.js app (API + redirects); placeholder workspace at apps/rhythm-engine.
- Studio UI: apps/rhythm-studio-ui (admin + clinician).
- Patient UI: apps/rhythm-patient-ui (patient portal).
- Core contracts: packages/rhythm-core (shared schemas + fixtures).

## Workflow Triggers
- studio-ci.yml: changes in apps/rhythm-studio-ui/** or packages/rhythm-core/**
- patient-ci.yml: changes in apps/rhythm-patient-ui/** or packages/rhythm-core/**
- engine-ci.yml: changes in apps/rhythm-engine/**, app/**, lib/**, next.config.ts, tsconfig.json, or packages/rhythm-core/**

## Independent Deploys
- Each UI can build and deploy independently because routing is isolated by paths.
- Engine remains the API host and redirect proxy for stable URLs.

## Contract Change Rules
- Changes in packages/rhythm-core trigger all dependent workflows.
- UI apps must consume contracts from rhythm-core, not local duplicates.
- Contract-breaking changes require coordinated updates across engine + UIs.

## Optional Root Gates
- Root `npm test` and `npm run build` remain available but are not required for UI-only changes.

---

## BASE_SHA Determination (R-CI-002)

**Rule**: All workflows using git diffs must use deterministic BASE_SHA resolution  
**Script**: `scripts/ci/get-base-sha.ps1`  
**Epic**: E72.ALIGN.P1.DETCON.001

### Deterministic Behavior

All workflows that perform diff-based checks use the shared `get-base-sha.ps1` script to ensure consistent BASE_SHA determination.

**PR Events** (`pull_request`):
1. Use GitHub-provided `github.event.pull_request.base.sha` if available
2. Fallback: Compute `git merge-base` between HEAD and `origin/main`
3. Fallback: Try merge-base with `FETCH_HEAD`
4. Fail-closed: Exit with error if merge-base cannot be computed

**Push Events** (`push`):
1. Use `github.event.before` if available and not zero SHA
2. Fallback: Use `HEAD~1` if git history is available
3. Fail-closed: Exit with error if neither is available

### Usage in Workflows

```yaml
- name: Determine BASE_SHA
  id: base-sha
  shell: pwsh
  run: |
    $result = & pwsh -File scripts/ci/get-base-sha.ps1 `
      -EventName "${{ github.event_name }}" `
      -PullRequestBaseSha "${{ github.event.pull_request.base.sha }}" `
      -EventBefore "${{ github.event.before }}" `
      -HeadSha "${{ github.sha }}"
    
    # Parse output and set environment variables
    $lines = $result -split "`n"
    foreach ($line in $lines) {
      if ($line -match '^BASE_SHA=(.+)$') {
        echo "BASE_SHA=$($Matches[1])" >> $env:GITHUB_ENV
      }
      if ($line -match '^HEAD_SHA=(.+)$') {
        echo "HEAD_SHA=$($Matches[1])" >> $env:GITHUB_ENV
      }
    }

- name: Use BASE_SHA in diff check
  run: |
    git diff --name-only "${{ env.BASE_SHA }}" "${{ env.HEAD_SHA }}"
```

### Fail-Closed Policy

The script fails with exit code 1 if BASE_SHA cannot be determined reliably. This prevents:
- Shallow clone issues (missing history)
- Nondeterministic fallback behavior
- Silent failures in diff-based checks

**Required**: All workflows using `get-base-sha.ps1` must use `fetch-depth: 0` in checkout step to ensure full git history.
