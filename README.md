This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Rhythmologicum Connect

A patient stress and resilience assessment platform with role-based access control.

### Features

- **Patient Portal** (`/patient`): Stress assessment questionnaire and history
- **Clinician Dashboard** (`/clinician`): Protected dashboard for healthcare providers
- **Role-Based Authentication**: Automatic routing based on user roles
- **Session Persistence**: Secure cookie-based authentication via Supabase
- **Responsive Design**: Works on desktop and mobile devices

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
- [Clinician Authentication Setup](docs/CLINICIAN_AUTH.md) - Complete setup guide
- [Authentication Flow](docs/AUTH_FLOW.md) - Detailed flow diagrams
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) - Technical overview

### Protected Routes

- `/clinician/*` - Requires authentication + clinician role
- `/patient/*` - Requires authentication

Unauthorized access attempts are logged and users are redirected with clear error messages.

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

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for detailed test procedures.
