# Deployment Verification Guide

## Overview

This guide helps you verify that production deployments are running the expected code version and database schema. Use this when investigating issues that may be caused by **deployment drift** rather than code bugs.

## Common Deployment Drift Symptoms

1. **404 errors on routes that exist in codebase** - PROD may be running an older commit
2. **500 errors with database-related messages** - Database migrations may not be applied
3. **Features behaving differently than local** - Environment variable mismatch
4. **Onboarding/consent issues** - Cache or stale deployment issues

## Quick Verification Steps

### 1. Verify PROD is Running Latest Commit

**Check deployed version:**

```bash
# Visit your production URL's version endpoint
curl https://your-production-url.vercel.app/version.json

# Expected output:
{
  "commitHash": "7f4e46bd...",
  "commitHashShort": "7f4e46b",
  "commitDate": "2026-01-09T15:39:08Z",
  "buildDate": "2026-01-09T16:00:00Z"
}
```

**Compare with latest main commit:**

```bash
# Get latest commit on main branch
git log main -1 --format="%H %cI"

# The commitHash from version.json should match
```

**In Vercel Dashboard:**

1. Go to: https://vercel.com/your-team/rhythmologicum-connect/deployments
2. Find the deployment marked as "Production"
3. Check the commit hash shown in the deployment details
4. Verify it matches your expected commit (e.g., `7f4e46b` or newer)

**If versions don't match:**
- A newer commit exists but hasn't been promoted to production
- See "Promoting a Deployment" below

### 2. Check Database Migration Status

**Verify migrations are applied in Supabase:**

1. Go to Supabase Dashboard → SQL Editor
2. Run this query:

```sql
-- Check which migrations are applied
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 10;

-- Check for specific recent migrations
SELECT version, name 
FROM supabase_migrations.schema_migrations 
WHERE version >= '20260109000000'  -- Adjust date as needed
ORDER BY version DESC;
```

**Compare with your codebase:**

```bash
# List recent migration files
ls -la supabase/migrations/ | tail -10

# Each migration file should have a corresponding row in schema_migrations
```

**If migrations are missing:**
- Migrations may not have been deployed to PROD database
- See "Applying Missing Migrations" below

### 3. View PROD Error Logs in Vercel

**Via Vercel Dashboard:**

1. Go to: https://vercel.com/your-team/rhythmologicum-connect
2. Click on the "Logs" tab (or "Runtime Logs")
3. Filter by:
   - **Status Code**: `500` for server errors, `404` for not found
   - **Time Range**: Last hour/day
   - **Path**: Specific route like `/api/content/resolve`

4. Look for structured log entries with:
   - Request IDs for tracing
   - Error codes and messages
   - Stack traces (if enabled)

**Via Vercel CLI:**

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# View real-time logs
vercel logs your-production-url.vercel.app --follow

# Filter by specific function
vercel logs your-production-url.vercel.app --output=api/content/resolve
```

**Common error patterns:**

- **404 on `/api/content/resolve`**: Route doesn't exist in deployed build
  - Check: Is the route file in the deployment's source?
  - Action: Verify commit includes the route file

- **500 on `/api/funnels/[slug]/content-pages`**: Database query failure
  - Check: Error message in logs for Supabase errors
  - Action: Verify migrations are applied, check RLS policies

- **Supabase errors**: Connection or query failures
  - Check: Environment variables are set correctly
  - Action: Verify `NEXT_PUBLIC_SUPABASE_URL` and keys in Vercel settings

### 4. Verify Environment Variables

**In Vercel Dashboard:**

1. Go to: https://vercel.com/your-team/rhythmologicum-connect/settings/environment-variables
2. Verify all required variables are set for **Production** environment:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY` (optional, for AMY)

3. Check for typos or missing values
4. Ensure variables are assigned to "Production" (not just Preview/Development)

**If variables are incorrect:**
- Update them in Vercel settings
- **Important**: You must **redeploy** for changes to take effect
  - Go to Deployments → Latest Production → "..." → "Redeploy"

## Common Fix Procedures

### Promoting a Deployment

If a newer commit is deployed but not promoted to production:

1. Go to: https://vercel.com/your-team/rhythmologicum-connect/deployments
2. Find the deployment with the correct commit hash
3. Click "..." menu → "Promote to Production"
4. Wait for promotion to complete (~30 seconds)
5. Verify by checking `/version.json` again

### Forcing a Redeploy

If the deployment exists but seems stale:

1. Go to latest production deployment
2. Click "..." menu → "Redeploy"
3. Ensure "Use existing Build Cache" is **unchecked** (fresh build)
4. Confirm redeploy
5. Wait for build to complete
6. Verify `/version.json` shows new build date

### Applying Missing Migrations

**Automatic via GitHub Actions:**

1. Ensure migrations exist in `supabase/migrations/` on `main` branch
2. Go to: https://github.com/adaefler-art/rhythmologicum-connect/actions
3. Find workflow: "Apply Supabase migrations"
4. Click "Run workflow" → Select "main" branch → Run
5. Monitor workflow for success
6. Verify in Supabase SQL Editor (see step 2 above)

**Manual via Supabase CLI:**

```bash
# Link to your production project
supabase link --project-ref your-production-project-ref

# Apply pending migrations
supabase db push

# Verify
supabase db diff --schema public
# Should show "No changes detected"
```

**⚠️ Important:** Always test migrations locally first!

### Clearing Cache Issues

If onboarding repeats or consent data seems stale:

**For Vercel deployment cache:**

1. Redeploy with cache cleared (see "Forcing a Redeploy" above)

**For browser cache:**

1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear site data:
   - Chrome: DevTools → Application → Clear Storage → "Clear site data"
   - Firefox: DevTools → Storage → Clear All

**For server-side cache:**

- Check if API routes have `cache: 'no-store'` in `fetch()` calls
- Check if Next.js has `export const dynamic = 'force-dynamic'` where needed
- Verify response headers include `Cache-Control: no-store` for dynamic content

## Rollback Procedure

If a deployment causes critical issues:

### Quick Rollback (Vercel)

1. Go to: https://vercel.com/your-team/rhythmologicum-connect/deployments
2. Find the last known-good deployment
3. Click "..." menu → "Promote to Production"
4. Confirm promotion
5. Verify issues are resolved

### Database Rollback (Advanced)

**⚠️ Warning:** Database rollbacks are risky! Only do this if absolutely necessary.

**Option 1: Restore from Supabase backup**

1. Go to Supabase Dashboard → Database → Backups
2. Find a backup from before the problematic migration
3. Click "Restore" (this creates a new project!)
4. Update Vercel environment variables to point to restored project
5. Redeploy application

**Option 2: Write a down migration**

```bash
# Create a new migration that undoes the problematic one
supabase migration new rollback_problematic_change

# Edit the migration file to reverse the changes
# e.g., DROP TABLE if you added one, ALTER TABLE to remove columns, etc.

# Test locally
supabase db reset

# Push to production (via GitHub Actions or manually)
```

**Best Practice:** Instead of rolling back, consider writing a forward-fixing migration.

## Build Verification (Pre-Deployment)

Before deploying to production, verify the build locally:

```bash
# Build the application
npm run build

# Verify critical routes exist in build output
node scripts/verify-routes.mjs

# Expected output:
# ✅ /api/content/resolve
# ✅ /api/funnels/[slug]/content-pages
# ✅ All critical routes verified successfully

# Start production server locally
npm run start

# Test critical endpoints
curl http://localhost:3000/api/content/resolve?funnel=stress-assessment&category=intro
curl http://localhost:3000/api/funnels/stress-assessment/content-pages
curl http://localhost:3000/version.json
```

## Monitoring Best Practices

### Set Up Alerts

**Vercel:**
- Configure alerts for deployment failures
- Set up monitors for critical API routes

**Supabase:**
- Monitor connection pool usage
- Set alerts for high error rates
- Track API response times

### Regular Health Checks

Create a monitoring script or use a service like:
- **Vercel Monitoring**: Built-in deployment and runtime monitoring
- **UptimeRobot**: Free uptime monitoring for critical endpoints
- **Better Uptime**: More advanced monitoring with team alerts

Check these endpoints regularly:
- `GET /version.json` - Verify deployment version
- `GET /api/content/resolve?funnel=stress-assessment&category=intro` - Content API
- `GET /api/funnels/stress-assessment/content-pages` - Funnel API

### Structured Logging

The application includes structured logging in critical API routes:

**In `/api/content/resolve`:**
```typescript
console.log('[Content Resolver]', {
  funnel,
  category,
  slug,
  strategy: 'category-first', // or 'slug-direct'
  requestId
})
```

**In `/api/funnels/[slug]/content-pages`:**
```typescript
console.log('[Funnel Content Pages]', {
  requestedSlug,
  effectiveSlug,
  funnelId,
  pageCount,
  requestId
})
```

These logs appear in Vercel Runtime Logs and can be used to trace requests.

## Troubleshooting Checklist

When investigating production issues:

- [ ] Check `/version.json` - is PROD running the expected commit?
- [ ] Check Vercel deployment page - is the right commit promoted?
- [ ] Check Supabase migrations table - are all migrations applied?
- [ ] Check Vercel environment variables - are they set correctly?
- [ ] Check Vercel logs - what errors are being logged?
- [ ] Check browser console - are there client-side errors?
- [ ] Check network tab - what status codes are returned?
- [ ] Try hard refresh - is it a cache issue?
- [ ] Compare local vs. PROD - does it work locally?
- [ ] Check Supabase RLS policies - are permissions correct?

## Getting Help

If issues persist after following this guide:

1. **Gather diagnostic information:**
   - Output from `/version.json`
   - Latest commit hash on `main` branch
   - Vercel deployment URL and commit
   - Relevant error logs from Vercel
   - Supabase migration status query results

2. **Check documentation:**
   - [README.md](../README.md) - Project overview
   - [Database Migrations](canon/DB_MIGRATIONS.md) - Migration workflow
   - [Deployment Guide](DEPLOYMENT_GUIDE.md) - Full deployment docs

3. **Open an issue:**
   - Include all diagnostic information above
   - Describe expected vs. actual behavior
   - List steps already tried
   - Tag with `priority: high` if production is down

## Additional Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Project Documentation**: See `/docs` directory for comprehensive guides
