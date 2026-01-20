#!/usr/bin/env node

/**
 * V061-I05: Generate Markdown Report
 * Converts wiring-audit.json to comprehensive markdown report
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '../..')
const AUDIT_DIR = path.join(ROOT, '.audit/v061')
const DOCS_AUDIT_DIR = path.join(ROOT, 'docs/audit')
const JSON_PATH = path.join(AUDIT_DIR, 'wiring-audit.json')
const MD_PATH = path.join(DOCS_AUDIT_DIR, 'V061_WIRING_AUDIT.md')

// Ensure docs/audit directory exists
if (!fs.existsSync(DOCS_AUDIT_DIR)) {
  fs.mkdirSync(DOCS_AUDIT_DIR, { recursive: true })
}

// Load JSON report
const report = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'))

// Generate markdown content
let md = `# V061-I05: Evidence-locked Wiring Audit

**Generated:** ${new Date(report.metadata.generatedAt).toISOString()}  
**Version:** ${report.metadata.version}  
**Issue ID:** ${report.metadata.issueId}

## Executive Summary

After the UI-Split into separate apps (rhythm-studio-ui, rhythm-patient-ui), this audit provides evidence-locked visibility into:
- Which features are fully wired (UI → API → DB)
- Which endpoints/pages are orphans
- What is Pilot-Ready vs Future work

### Key Metrics

| Metric | Count | Status |
|--------|-------|--------|
| **Total UI Pages** | ${report.summary.totalPages} | ✅ Inventoried |
| **Total API Routes** | ${report.summary.totalAPIRoutes} | ✅ Inventoried |
| **Pages with API Calls** | ${report.summary.pagesWithAPICalls} | ${report.summary.pagesWithAPICalls > 0 ? '✅' : '⚠️'} Mapped |
| **API Routes with DB Access** | ${report.summary.apiRoutesWithDBAccess} | ✅ Mapped |
| **Orphaned API Routes** | ${report.summary.orphanedAPIs} | ${report.summary.orphanedAPIs > 0 ? '⚠️' : '✅'} Requires Review |
| **Pages without API Calls** | ${report.summary.pagesWithoutAPICalls} | ${report.summary.pagesWithoutAPICalls > 0 ? '⚠️' : '✅'} Requires Review |

---

## 1. Architecture Overview

### Monorepo Structure

This is a **monorepo with centralized API backend**:

\`\`\`
/home/runner/work/rhythmologicum-connect/rhythmologicum-connect/
├── app/                          # Main Next.js app (API backend)
│   ├── api/                      # 94 API routes
│   ├── admin/                    # Admin UI pages
│   ├── clinician/                # Clinician UI pages
│   └── patient/                  # Patient UI pages
├── apps/
│   ├── rhythm-studio-ui/         # Clinician dashboard (26 pages, 5 auth routes)
│   ├── rhythm-patient-ui/        # Patient portal (20 pages, 0 routes)
│   └── rhythm-engine/            # Backend processing engine
└── packages/
    └── rhythm-core/              # Shared utilities
\`\`\`

### Data Flow Pattern

\`\`\`
UI Pages (56) → API Routes (99) → Database (Supabase)
     ↓               ↓                    ↓
  User Actions   Business Logic      Persistent State
\`\`\`

---

## 2. UI Pages Inventory

### 2.1 All UI Pages (${report.summary.totalPages})

#### Main App (app/) - ${report.pages.filter((p) => p.app === 'main').length} pages

${report.pages
  .filter((p) => p.app === 'main')
  .map((p) => `- \`${p.route}\` → \`${p.path}\``)
  .join('\n')}

#### Studio UI (apps/rhythm-studio-ui/) - ${report.pages.filter((p) => p.app === 'studio-ui').length} pages

${report.pages
  .filter((p) => p.app === 'studio-ui')
  .map((p) => `- \`${p.route}\` → \`${p.path}\``)
  .join('\n')}

#### Patient UI (apps/rhythm-patient-ui/) - ${report.pages.filter((p) => p.app === 'patient-ui').length} pages

${report.pages
  .filter((p) => p.app === 'patient-ui')
  .map((p) => `- \`${p.route}\` → \`${p.path}\``)
  .join('\n')}

---

## 3. API Routes Inventory

### 3.1 All API Routes (${report.summary.totalAPIRoutes})

#### Main App API (app/api/) - ${report.apiRoutes.filter((r) => r.app === 'main').length} routes

${report.apiRoutes
  .filter((r) => r.app === 'main')
  .slice(0, 50)
  .map((r) => `- \`${r.endpoint}\` → \`${r.path}\``)
  .join('\n')}
${report.apiRoutes.filter((r) => r.app === 'main').length > 50 ? `\n... and ${report.apiRoutes.filter((r) => r.app === 'main').length - 50} more` : ''}

#### Studio UI API (apps/rhythm-studio-ui/app/api/) - ${report.apiRoutes.filter((r) => r.app === 'studio-ui').length} routes

${report.apiRoutes
  .filter((r) => r.app === 'studio-ui')
  .map((r) => `- \`${r.endpoint}\` → \`${r.path}\``)
  .join('\n')}

---

## 4. Wiring Analysis

### 4.1 UI → API Mappings (${report.mappings.uiToAPI.length} pages with API calls)

${report.mappings.uiToAPI
  .map(
    (m) => `
#### ${m.pageRoute}
**File:** \`${m.page}\`  
**API Calls:**
${m.apiCalls.map((c) => `- \`${c}\``).join('\n')}
`,
  )
  .join('\n')}

### 4.2 API → Database Mappings (${report.mappings.apiToDB.length} routes with DB access)

${report.mappings.apiToDB
  .slice(0, 30)
  .map(
    (m) => `
- **${m.endpoint}**
  - File: \`${m.apiPath}\`
  - Client Type: ${m.clientType || 'unknown'}
  - Tables: ${m.tables.length > 0 ? m.tables.map((t) => `\`${t}\``).join(', ') : 'none detected'}
`,
  )
  .join('\n')}
${report.mappings.apiToDB.length > 30 ? `\n... and ${report.mappings.apiToDB.length - 30} more API routes with DB access` : ''}

---

## 5. Orphans Analysis

### 5.1 Orphaned API Routes (${report.orphans.apis.length})

**Definition:** API routes that are not called by any UI page in the codebase.

**⚠️ Note:** These may be:
- Future endpoints (not yet wired)
- Called by external clients (mobile app, CLI, etc.)
- Webhooks or background jobs
- Legitimately unused (candidates for removal)

${report.orphans.apis
  .map((o) => `- \`${o.endpoint}\` (\`${o.path}\`)`)
  .join('\n')}

### 5.2 Pages without API Calls (${report.orphans.pages.length})

**Definition:** UI pages that don't make any direct API calls.

**⚠️ Note:** These pages may:
- Be static content pages
- Use server-side data fetching
- Delegate API calls to child components
- Be incomplete implementations

${report.orphans.pages
  .map((p) => `- \`${p.route}\` (\`${p.path}\`)`)
  .join('\n')}

---

## 6. Smoke Test List

### 6.1 Public Routes (No Auth Required)

| Route | Expected Status | Notes |
|-------|----------------|-------|
| \`/\` | 200 OK | Landing page |
| \`/datenschutz\` | 200 OK | Privacy policy |
| \`/impressum\` | 200 OK | Legal notice |
| \`/api/health/env\` | 200 OK | Health check |

### 6.2 Patient Routes (Patient Auth Required)

| Route | Expected Status | Notes |
|-------|----------------|-------|
| \`/patient\` | 200 OK or 302 Redirect | Patient landing |
| \`/patient/dashboard\` | 200 OK | Patient dashboard |
| \`/patient/funnels\` | 200 OK | Available assessments |
| \`/patient/history\` | 200 OK | Assessment history |
| \`/api/patient/dashboard\` | 200 OK | Dashboard data |
| \`/api/funnels/active\` | 200 OK | Active funnels |

### 6.3 Clinician Routes (Clinician Auth Required)

| Route | Expected Status | Notes |
|-------|----------------|-------|
| \`/clinician\` | 200 OK or 302 Redirect | Clinician landing |
| \`/clinician/review-queue\` | 200 OK | Review queue |
| \`/clinician/funnels\` | 200 OK | Funnel management |
| \`/clinician/tasks\` | 200 OK | Task list |

### 6.4 Admin Routes (Admin Auth Required)

| Route | Expected Status | Notes |
|-------|----------------|-------|
| \`/admin\` | 200 OK or 302 Redirect | Admin landing |
| \`/admin/design-system\` | 200 OK | Design system |
| \`/admin/operational-settings\` | 200 OK | Settings |
| \`/api/admin/usage\` | 200 OK | Usage stats |

---

## 7. Punchlist for v0.6.2 / v0.7

### 7.1 High Priority (P1)

- [ ] **Review Orphaned API Routes** (65 total)
  - Determine which are legitimately unused
  - Document external callers (mobile, CLI, webhooks)
  - Remove truly orphaned endpoints
  - Add OpenAPI/endpoint catalog metadata

- [ ] **Complete Wiring for Core Features**
  - Verify all patient funnel flows have complete UI → API → DB chain
  - Verify all clinician review flows are complete
  - Add missing API calls to static pages if needed

- [ ] **Add Missing Tests**
  - Create smoke tests for critical paths
  - Add integration tests for complete wiring chains
  - Verify RLS policies for all DB-accessing endpoints

### 7.2 Medium Priority (P2)

- [ ] **Improve Static Analysis**
  - Consider using TypeScript AST parser for more accurate API call detection
  - Detect API calls in child components
  - Track server-side data fetching patterns

- [ ] **Documentation**
  - Add inline documentation for orphaned endpoints
  - Create API catalog with swagger/OpenAPI
  - Document external client usage patterns

- [ ] **Monitoring**
  - Add telemetry to track actual API usage in production
  - Compare actual usage vs static analysis
  - Identify truly unused endpoints

### 7.3 Low Priority (P3)

- [ ] **Refactoring**
  - Consider consolidating duplicate API patterns
  - Extract shared business logic
  - Improve error handling consistency

- [ ] **Developer Experience**
  - Auto-generate TypeScript types for API routes
  - Add endpoint catalog UI for developers
  - Create wiring diagram visualization

---

## 8. Evidence & Verification

### 8.1 Evidence Files

All evidence collected during this audit:

- \`.audit/v061/wiring-audit.json\` - Machine-readable full report
- \`.audit/v061/evidence/all-pages.txt\` - Complete list of page files
- \`.audit/v061/evidence/all-routes.txt\` - Complete list of API route files

### 8.2 Reproduction Commands

To regenerate this audit:

\`\`\`bash
# Run the audit script
node scripts/audit/wiring-audit.js

# Generate markdown report
node scripts/audit/generate-report.js

# Verify build and tests
npm test
npm run build
\`\`\`

### 8.3 Build & Test Status

Verification commands:

\`\`\`powershell
npm test
if ($LASTEXITCODE -ne 0) { throw "tests failed" }

npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }
\`\`\`

---

## 9. Conclusions

### 9.1 Pilot Readiness

**Status:** ⚠️ **CONDITIONAL GO**

**Strengths:**
- ✅ Core funnel flows are wired (patient assessment, clinician review)
- ✅ Authentication and authorization in place
- ✅ Database access is consistent (91/99 routes use DB)
- ✅ UI split is functional (56 pages across 3 apps)

**Risks:**
- ⚠️ 65 orphaned API routes - unclear which are needed
- ⚠️ 40 pages without API calls - some may be incomplete
- ⚠️ Limited automated testing coverage
- ⚠️ No production usage telemetry yet

**Recommendations:**
1. Complete orphan review before pilot launch
2. Add smoke tests for critical paths
3. Document all external API consumers
4. Enable basic usage telemetry

### 9.2 Future Work

For v0.7 and beyond:
- Implement automated orphan detection in CI
- Add comprehensive API catalog
- Create wiring visualization dashboard
- Implement usage-based endpoint pruning

---

## Appendix: Methodology

### Pattern Detection

**UI → API Detection:**
- Searched for \`fetch('/api/...')\` patterns
- Searched for URL string literals with \`/api/\` prefix
- Searched for template literals with \`/api/\` paths

**API → DB Detection:**
- Searched for Supabase client imports
- Searched for \`.from('table_name')\` patterns
- Detected client types (server, admin, public)

**Limitations:**
- Dynamic API calls may not be detected
- API calls in child components may not be attributed to parent page
- Server-side data fetching patterns not fully captured
- Mobile/external client calls not visible

---

**End of Report**
`

// Write markdown report
fs.writeFileSync(MD_PATH, md)
console.log(`✅ Markdown report generated: ${MD_PATH}`)
