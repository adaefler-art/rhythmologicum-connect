# Environment Variables Quick Reference

## Table of Contents
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Feature Flags](#feature-flags)
- [Environment-Specific Setup](#environment-specific-setup)
- [Security Notes](#security-notes)

---

## Required Variables

### NEXT_PUBLIC_SUPABASE_URL
- **Type:** String (URL)
- **Required:** Yes
- **Scope:** Public (client + server)
- **Example:** `https://abcdefgh.supabase.co`
- **Where to find:** Supabase Dashboard → Settings → API → Project URL
- **Used in:** 13 locations across the app

### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Type:** String (JWT)
- **Required:** Yes
- **Scope:** Public (client + server)
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find:** Supabase Dashboard → Settings → API → anon public key
- **Used in:** 6 locations across the app
- **Security:** Safe to expose - protected by Row Level Security (RLS)

### SUPABASE_SERVICE_ROLE_KEY
- **Type:** String (JWT)
- **Required:** Yes
- **Scope:** Server-side only
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find:** Supabase Dashboard → Settings → API → service_role key
- **Used in:** 8 locations (API routes only)
- **Security:** 🔒 **KEEP SECRET** - has full database access, bypasses RLS

**Alternative names (legacy support):**
- `SUPABASE_URL` (alternative to `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_KEY` (alternative to `SUPABASE_SERVICE_ROLE_KEY`)

---

## Optional Variables

### ANTHROPIC_API_KEY
- **Type:** String
- **Required:** No
- **Scope:** Server-side only
- **Example:** `sk-ant-api03-...`
- **Where to find:** https://console.anthropic.com → API Keys
- **Used in:** 2 locations (AMY API routes)
- **Fallback:** Uses generic text from `lib/amyFallbacks.ts`
- **Security:** 🔒 **KEEP SECRET**

**Alternative names:**
- `ANTHROPIC_API_TOKEN` (legacy)

### ANTHROPIC_MODEL
- **Type:** String
- **Required:** No
- **Scope:** Server-side only
- **Default:** `claude-sonnet-4-5-20250929`
- **Example:** `claude-sonnet-4-5-20250929`
- **Used in:** 2 locations (AMY API routes)

---

## Feature Flags

All feature flags are optional and default to `true` (enabled).

### Accepted Values
- **Enable:** `true`, `1`, `yes` (case-insensitive)
- **Disable:** `false`, `0`, `no` (case-insensitive)

### NEXT_PUBLIC_FEATURE_AMY_ENABLED
- **Default:** `true`
- **Scope:** Public (client + server)
- **Used in:** 2 locations
- **When disabled:**
  - AMY sections hidden from UI
  - API routes use fallback text
  - No Anthropic API calls made
  - Patients see scores without AI text
  - Clinicians see data without AMY reports

### NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED
- **Default:** `true`
- **Scope:** Public (client + server)
- **Used in:** 3 locations (middleware + components)
- **When disabled:**
  - `/clinician` routes blocked by middleware
  - Clinicians redirected to patient portal
  - Error message displayed
  - Middleware logs feature disabled

### NEXT_PUBLIC_FEATURE_CHARTS_ENABLED
- **Default:** `true`
- **Scope:** Public (client + server)
- **Used in:** 2 locations
- **When disabled:**
  - Chart sections hidden in clinician views
  - Other patient data remains accessible
  - No impact on data integrity

**See also:** `docs/FEATURE_FLAGS.md` for detailed feature flag documentation

---

## Environment-Specific Setup

### Local Development

**File:** `.env.local`

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Optional
ANTHROPIC_API_KEY=your-api-key

# Feature flags (optional)
NEXT_PUBLIC_FEATURE_AMY_ENABLED=true
NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED=true
NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=true
```

**Setup:**
```bash
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

### Vercel Production

**Location:** Vercel Dashboard → Settings → Environment Variables

**Environment:** Production

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase URL | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service key | Required, secret |
| `ANTHROPIC_API_KEY` | Production API key | Recommended, secret |

**Feature flags:** Only add if you want to disable features (all default to `true`)

### Vercel Preview

**Location:** Vercel Dashboard → Settings → Environment Variables

**Environment:** Preview

**Options:**

1. **Recommended:** Use separate Supabase project
   - Better isolation
   - Safer for testing
   - No risk to production data

2. **Alternative:** Use same Supabase project as production
   - Simpler setup
   - Shared database
   - Use with caution

**Variables:** Same as production, but with Preview environment selected

---

## Security Notes

### Public vs. Secret Variables

**Safe to expose (NEXT_PUBLIC_*):**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (protected by RLS)
- ✅ `NEXT_PUBLIC_FEATURE_*` (all feature flags)

**Must keep secret:**
- 🔒 `SUPABASE_SERVICE_ROLE_KEY` - Full database access
- 🔒 `ANTHROPIC_API_KEY` - API costs and usage

### Best Practices

1. **Never commit secrets to Git:**
   - `.env.local` is in `.gitignore`
   - Use `.env.example` as template
   - Never hardcode secrets in code

2. **Use environment scopes in Vercel:**
   - Production: For main branch deployments
   - Preview: For pull request deployments
   - Development: Local only (not used on Vercel)

3. **Rotate keys if exposed:**
   - Generate new keys in Supabase/Anthropic
   - Update all environments
   - Revoke old keys

4. **Use Row Level Security (RLS):**
   - All tables protected by RLS policies
   - Anon key is safe to expose
   - Service role bypasses RLS (keep secret!)

5. **Separate projects for environments:**
   - Recommended: Different Supabase projects for prod/preview
   - Better isolation
   - Safer testing

---

## Troubleshooting

### Build fails with "supabaseUrl is required"

**Cause:** Missing environment variables

**Solution:**
1. Check that all 3 required variables are set
2. Check variable names match exactly (case-sensitive)
3. Redeploy after adding variables

### AMY shows generic text instead of personalized

**Cause:** `ANTHROPIC_API_KEY` not set or invalid

**Solution:**
1. Add `ANTHROPIC_API_KEY` to environment variables
2. Verify key is valid in Anthropic console
3. Check API rate limits
4. Redeploy

**Note:** Generic text is expected fallback behavior when Anthropic is unavailable

### Environment variables not updating

**Cause:** Vercel caches environment variables

**Solution:**
1. Trigger new deployment:
   ```bash
   git commit --allow-empty -m "Redeploy"
   git push
   ```
2. Or use Vercel Dashboard → Deployments → Redeploy

### Feature flag not working

**Cause:** Various issues

**Solution:**
1. Check variable name exactly matches (case-sensitive)
2. Restart dev server after changing `.env.local`
3. Clear browser cache
4. Check value is valid: `true`/`false`/`1`/`0`/`yes`/`no`
5. For Vercel: Trigger redeploy

---

## Variable Usage Matrix

| Variable | Client | Server | API Routes | Middleware | Build Time |
|----------|--------|--------|------------|------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | ❌ | ✅ | ❌ | ✅ |
| `ANTHROPIC_API_KEY` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `ANTHROPIC_MODEL` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `NEXT_PUBLIC_FEATURE_AMY_ENABLED` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_FEATURE_CHARTS_ENABLED` | ✅ | ✅ | ✅ | ❌ | ✅ |

**Legend:**
- ✅ Used in this context
- ❌ Not used/not accessible in this context

---

## Additional Resources

- **[docs/DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Full deployment guide (German)
- **[docs/FEATURE_FLAGS.md](FEATURE_FLAGS.md)** - Feature flags documentation
- **[.env.example](../.env.example)** - Environment variable template
- **[README.md](../README.md)** - Project overview

---

**Version:** 1.0.0  
**Last Updated:** 2025-12-07
