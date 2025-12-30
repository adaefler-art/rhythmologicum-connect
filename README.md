This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Rhythmologicum Connect

A patient stress and resilience assessment platform with role-based access control.

**📊 [Executive Summary v0.3](docs/Z4_EXECUTIVE_SUMMARY_V0.3.md)** - Comprehensive project overview and current status

### Features

- **Data-Driven Funnel System**: Complete assessment workflow engine with validation and navigation
- **Patient Portal** (`/patient/funnel/stress-assessment`): Unified, mobile-friendly stress assessment flow
- **Patient History** (`/patient/history`): View past assessments and results
- **Clinician Dashboard** (`/clinician`): Protected dashboard for healthcare providers with funnel management
- **Role-Based Authentication**: Automatic routing based on user roles
- **Session Persistence**: Secure cookie-based authentication via Supabase
- **Responsive Design**: Mobile-first design optimized for all devices

### Funnel System (Epic B)

The application features a complete, production-ready funnel system for patient assessments:

- ✅ **Data-Driven Definitions** (B1) - All funnels defined in database
- ✅ **Required Validation** (B2) - Step-by-step and full-funnel validation
- ✅ **Smart Navigation** (B3) - Automated step progression with performance < 150ms
- ✅ **Runtime Backend** (B5) - Complete API for assessment lifecycle
- ✅ **Frontend Integration** (B6) - Seamless, reload-safe user experience
- ✅ **Clinician Tools** (B7) - Funnel management interface at `/clinician/funnels`
- ✅ **Enterprise Quality** (B8) - Harmonized APIs, structured logging, monitoring hooks

**📖 Complete documentation:** 
- [Epic B Consolidation](docs/EPIC_B_CONSOLIDATION.md) - Funnel system architecture
- [Patient Flow V2 Structure](docs/PATIENT_FLOW_V2_STRUCTURE.md) - Detailed patient journey documentation
- [Patient Flow V2 Diagrams](docs/PATIENT_FLOW_V2_DIAGRAM.md) - Visual flow diagrams

### Content Pages (Epic D & F)

Editorial content system for contextual information within funnels:

- ✅ **Content Rendering** (D1) - Markdown content pages with professional typography
- ✅ **Funnel Integration** (D2) - Context-aware display using slug-based categorization
- ✅ **Dynamic Result Blocks** (F8) - Database-driven content on result pages
- 📄 **Intro Pages** (`intro-*`) - Shown before/during assessment
- 📄 **Info Pages** (`info-*`) - Additional information available throughout
- 📄 **Result Pages** (`result-*`) - Next steps and interpretation after completion

**📖 Documentation:** 
- [D1: Content Pages](docs/D1_CONTENT_PAGES.md) - Content rendering system
- [D2: Content Integration](docs/D2_CONTENT_INTEGRATION.md) - Editor guide for funnel context
- [F8: Dynamic Result Blocks](docs/F8_IMPLEMENTATION_SUMMARY.md) - Result page content system
- [F8: Quick Start](docs/F8_QUICKSTART.md) - How to add result content blocks

### User Roles

- **Patient**: Access to personal stress assessment and history
- **Clinician**: Access to all patient reports and detailed assessments

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Authentication & Access Control

This application uses Supabase for authentication with role-based access control.

### Setting Up Clinician Access

After creating a user account, assign the clinician role:

```sql
-- Using the helper function
SELECT set_user_role('doctor@example.com', 'clinician');

-- Or directly update the user
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"clinician"'
)
WHERE email = 'doctor@example.com';
```

**📚 Detailed documentation:**
- [Executive Summary v0.3](docs/Z4_EXECUTIVE_SUMMARY_V0.3.md) - **Current project status and overview** (German)
- [Clinician Authentication Setup](docs/CLINICIAN_AUTH.md) - Complete setup guide
- [Clinician Dashboard Quick Guide](docs/Z3_CLINICIAN_DASHBOARD_GUIDE.md) - User guide for clinicians (German)
- [Authentication Flow](docs/AUTH_FLOW.md) - Detailed flow diagrams
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) - Technical overview

### Protected Routes

- `/clinician/*` - Requires authentication + clinician role
- `/patient/*` - Requires authentication

Unauthorized access attempts are logged and users are redirected with clear error messages.

## Database & Migrations

The application uses Supabase (PostgreSQL) with automated migration deployment and strict determinism enforcement.

### DB Determinism & Type Safety

**CI enforces migration-first discipline:**
- ✅ All schema changes must be in migration files
- ✅ No manual database edits allowed (drift detection)
- ✅ TypeScript types must stay in sync with schema
- ❌ PRs fail if types are out of date or drift is detected

**Type generation workflow:**
```powershell
# After creating/modifying migrations
supabase db reset              # Apply all migrations
npm run db:typegen            # Generate TypeScript types
git add lib\types\supabase.ts # Commit generated types
```

The CI workflow (`db-determinism.yml`) automatically verifies:
1. No existing migrations were edited
2. Migrations apply cleanly
3. No schema drift exists
4. Generated types match database schema

**📚 See:** [DB Migrations Guide](docs/canon/DB_MIGRATIONS.md) - Complete workflow with PowerShell runbook

### Automated Migration Deployment

Migrations are automatically applied when changes are merged to the `main` branch:

1. **Push to main** → Migrations in `supabase/migrations/` are automatically deployed
2. **Manual trigger** → Run the "Apply Supabase migrations" workflow from GitHub Actions

### Required GitHub Secrets

For automated deployment to work, configure these secrets in GitHub repository settings:

- `SUPABASE_ACCESS_TOKEN` - Service role key from Supabase Dashboard → Settings → API
- `SUPABASE_PROJECT_ID` - Project reference ID from Supabase Dashboard → Project Settings

### Local Development

Apply migrations locally using Supabase CLI:

```powershell
# Start local Supabase
supabase start

# Reset database and apply all migrations
supabase db reset

# Generate TypeScript types
npm run db:typegen

# Verify no drift or uncommitted changes
npm run db:verify
```

### Verify Migrations

**Before deployment:**
```powershell
npm run db:verify  # Full determinism check
```

**After deployment:**
```sql
-- In Supabase Dashboard → SQL Editor, run:
-- Check funnel exists
SELECT slug, title FROM public.funnels WHERE slug = 'stress-assessment';

-- Check content pages (should return 10)
SELECT COUNT(*) FROM public.content_pages 
WHERE funnel_id = (SELECT id FROM funnels WHERE slug = 'stress-assessment');
```

For comprehensive verification, use `scripts/verify-migrations.sql` in Supabase SQL Editor.

**📚 Documentation:**
- [Database Migrations](docs/canon/DB_MIGRATIONS.md) - Migration-first workflow & PowerShell runbook
- [Migration Deployment Guide](docs/DEPLOYMENT_MIGRATIONS.md) - Automated deployment setup
- [F11 Seed Pages](docs/F11_SEED_PAGES.md) - Content page seeding

## Environment Variables

### Quick Setup

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your values in `.env.local`

### Required Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these from your Supabase project: **Settings → API**

⚠️ **Important:** Keep `SUPABASE_SERVICE_ROLE_KEY` secret! This key has full database access.

### Optional Variables

```bash
# For AMY AI features (recommended)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Specify Anthropic model (optional, has default)
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
```

**📚 Complete documentation:** See [`.env.example`](.env.example) for all variables and detailed descriptions.

### Feature Flags

The application supports feature flags to enable/disable specific functionality. All feature flags are optional and default to `true` (enabled) for backward compatibility.

**Available Feature Flags:**

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `NEXT_PUBLIC_FEATURE_AMY_ENABLED` | `true` | Enable/disable AMY AI assistant for personalized stress assessments |
| `NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED` | `true` | Enable/disable the clinician dashboard and all related features |
| `NEXT_PUBLIC_FEATURE_CHARTS_ENABLED` | `true` | Enable/disable charts in clinician patient detail views |

**Setting Feature Flags:**

Create a `.env.local` file in the project root:

```bash
# Disable AMY AI assistant
NEXT_PUBLIC_FEATURE_AMY_ENABLED=false

# Disable clinician dashboard
NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED=false

# Disable charts
NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=false
```

**Accepted Values:**
- Enable: `true`, `1`, `yes` (case-insensitive)
- Disable: `false`, `0`, `no`, or any other value (case-insensitive)

**Behavior When Features Are Disabled:**

- **AMY_ENABLED=false**: AMY AI text sections are hidden from patient results and history. The API falls back to generic stress assessments without AI personalization.
- **CLINICIAN_DASHBOARD_ENABLED=false**: The `/clinician` routes are blocked at the middleware level. Clinician users are redirected to the patient portal with an appropriate message.
- **CHARTS_ENABLED=false**: Chart visualizations are hidden from the clinician patient detail page, but other patient data remains accessible.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/adaefler-art/rhythmologicum-connect)

### Manual Deployment

1. **Prerequisites:**
   - Vercel account connected to GitHub
   - Supabase project with database schema deployed
   - (Optional) Anthropic API key for AMY AI features

2. **Import Project:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select `adaefler-art/rhythmologicum-connect`
   - Framework preset: **Next.js** (auto-detected)

3. **Configure Environment Variables:**
   
   In Vercel Dashboard → Settings → Environment Variables, add:

   **Required (Production & Preview):**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

   **Recommended:**
   - `ANTHROPIC_API_KEY` (for AMY AI features)

4. **Deploy:**
   ```bash
   git push origin main
   ```

5. **Verify:**
   - Run smoke tests (see deployment guide)
   - Check all core features are working

### Documentation

- **📖 [Complete Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Comprehensive German deployment documentation with:
  - Step-by-step Vercel setup
  - Environment variable explanations
  - Environment-specific configurations
  - Smoke test procedures
  - Troubleshooting guide
  - Deployment checklist

- **📋 [.env.example](.env.example)** - Template for all environment variables

- **🏗️ [vercel.json](vercel.json)** - Vercel configuration with security headers

### Post-Deployment

After deployment, perform these smoke tests:

1. ✅ Homepage loads
2. ✅ Patient registration works
3. ✅ Patient can complete stress assessment
4. ✅ Results display correctly
5. ✅ AMY report generated (if enabled)
6. ✅ Clinician can login and view patients
7. ✅ Charts display (if enabled)

**📋 For comprehensive end-to-end testing:**
- **[E4 Smoke Test Guide](docs/E4_SMOKE_TEST.md)** - Complete checklist for pilot practice with all critical flows
- **[E1 Mobile Device Testing](docs/E1_MOBILE_DEVICE_TESTING.md)** - Comprehensive guide for testing mobile UI on iPhone & Android
- **[Z2 Pilot Readiness Checklist](docs/Z2_PILOT_READINESS_CHECKLIST.md)** - Complete guide for preparing and launching the remote pilot (German, non-technical friendly)

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for detailed test procedures.

---

## 📚 Documentation Hub

The project documentation is organized into three main areas:

### [📖 Canon Documentation](docs/canon/)
**Timeless principles and standards** - These documents define core practices that don't change with versions:
- [Principles](docs/canon/PRINCIPLES.md) - Core development principles
- [Review Checklist](docs/canon/REVIEW_CHECKLIST.md) - Code review standards
- [Glossary](docs/canon/GLOSSARY.md) - Project terminology
- [Database Migrations](docs/canon/DB_MIGRATIONS.md) - Migration best practices
- [Contracts](docs/canon/CONTRACTS.md) - API and component contracts

### [🚀 Release Documentation](docs/releases/)
**Version-specific information** - Release notes, plans, and artifacts:
- [Current Status](docs/releases/CURRENT.md) - **Start here** for release information
- [v0.4 Release](docs/releases/v0.4/) - Production release (December 2025)
  - [Release Notes](docs/releases/v0.4/RELEASE.md)
  - [Changelog](docs/releases/v0.4/changelog.md) (German)
  - [Verdict](docs/releases/v0.4/verdict.json) - Structured release data
- [v0.5 Planning](docs/releases/v0.5/) - Next version planning
  - [Release Plan](docs/releases/v0.5/RELEASE.md)
  - [Backlog](docs/releases/v0.5/backlog.md)
  - [Verdict](docs/releases/v0.5/verdict.json) - Planning status

### [🧠 Project Memory](docs/memory/)
**Learnings and incidents** - Institutional knowledge base:
- [Memory Index](docs/memory/INDEX.md) - Overview and search guide
- `entries/` - Key learnings and architectural decisions
- `incidents/` - Post-incident reviews and resolutions

### Legacy Documentation
- [Archive (v0.3)](docs/_archive_0_3/) - Historical documentation from v0.3
- [Current v0.4 Implementation Docs](docs/) - Active v0.4 implementation details
