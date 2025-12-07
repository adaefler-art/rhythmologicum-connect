# Feature Flags Documentation

## Overview

The application implements a centralized feature flag system to control the availability of specific features. This allows for easy activation/deactivation of functionality without code changes.

## Configuration

### Available Feature Flags

| Flag Name | Environment Variable | Default | Description |
|-----------|---------------------|---------|-------------|
| `AMY_ENABLED` | `NEXT_PUBLIC_FEATURE_AMY_ENABLED` | `true` | Controls AMY AI assistant functionality |
| `CLINICIAN_DASHBOARD_ENABLED` | `NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED` | `true` | Controls access to clinician dashboard |
| `CHARTS_ENABLED` | `NEXT_PUBLIC_FEATURE_CHARTS_ENABLED` | `true` | Controls chart visualizations in clinician views |

### Environment Variable Format

Feature flags are controlled through environment variables with the prefix `NEXT_PUBLIC_FEATURE_`.

**Accepted Values:**
- **Enable**: `true`, `1`, `yes` (case-insensitive)
- **Disable**: `false`, `0`, `no`, or any other value

**Example `.env.local`:**

```bash
# Enable all features (default behavior)
NEXT_PUBLIC_FEATURE_AMY_ENABLED=true
NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED=true
NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=true

# Disable specific features
NEXT_PUBLIC_FEATURE_AMY_ENABLED=false
NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED=0
NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=no
```

## Implementation Details

### Architecture

The feature flag system is implemented in `lib/featureFlags.ts`:

```typescript
export type FeatureFlags = {
  AMY_ENABLED: boolean
  CLINICIAN_DASHBOARD_ENABLED: boolean
  CHARTS_ENABLED: boolean
}

export const featureFlags: FeatureFlags = {
  AMY_ENABLED: parseEnvBoolean(
    process.env.NEXT_PUBLIC_FEATURE_AMY_ENABLED,
    true
  ),
  // ... other flags
}
```

### Usage in Code

**Client-side components:**

```typescript
import { featureFlags } from '@/lib/featureFlags'

export default function MyComponent() {
  return (
    <>
      {featureFlags.AMY_ENABLED && (
        <div>AMY content here</div>
      )}
    </>
  )
}
```

**Server-side middleware:**

```typescript
import { parseEnvBoolean } from './featureFlags'

function isFeatureEnabled(): boolean {
  return parseEnvBoolean(
    process.env.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
    true
  )
}
```

## Feature-Specific Behavior

### AMY_ENABLED

**When Enabled (default):**
- AMY AI-generated personalized stress assessments are displayed
- Patient result page shows "Deine persönliche Einordnung von AMY"
- Patient history shows AMY reports for each assessment
- Clinician views include AMY reports timeline
- API route `/api/amy/stress-report` uses Anthropic Claude for text generation

**When Disabled:**
- AMY sections are completely hidden from UI
- API route falls back to generic assessment text (from `amyFallbacks.ts`)
- No Anthropic API calls are made
- Patients see stress scores but no personalized AI text
- Clinicians see patient data without AMY reports

**Affected Files:**
- `app/api/amy/stress-report/route.ts` - API fallback logic
- `app/patient/stress-check/result/StressResultClient.tsx` - Patient result view
- `app/patient/history/PatientHistoryClient.tsx` - Patient history view
- `app/clinician/patient/[id]/page.tsx` - Clinician patient detail
- `app/clinician/report/[id]/page.tsx` - Clinician report detail

### CLINICIAN_DASHBOARD_ENABLED

**When Enabled (default):**
- `/clinician` routes are accessible to authenticated clinician users
- Clinicians are redirected to `/clinician` after login
- Full access to patient overview, patient details, and reports

**When Disabled:**
- Middleware blocks all `/clinician` routes with 302 redirect
- Redirect to `/?error=feature_disabled&message=...`
- Clinician users are redirected to patient portal with notification
- Error message: "Das Kliniker-Dashboard ist derzeit nicht verfügbar"

**Affected Files:**
- `middleware.ts` - Route protection
- `app/page.tsx` - Login redirect logic

### CHARTS_ENABLED

**When Enabled (default):**
- Stress-Verlauf (stress trend) chart is displayed
- Schlaf-Verlauf (sleep trend) chart is displayed
- Charts show historical data with SVG line graphs

**When Disabled:**
- Chart sections are completely hidden
- Patient data remains accessible in other formats
- No visual impact on data integrity

**Affected Files:**
- `app/clinician/patient/[id]/page.tsx` - Patient detail charts section

## Testing Guide

### Manual Testing Scenarios

#### Test Case 1: AMY Feature Toggle

**Setup:**
```bash
# Create .env.local
NEXT_PUBLIC_FEATURE_AMY_ENABLED=false
```

**Steps:**
1. Start development server: `npm run dev`
2. Complete a stress assessment as a patient
3. View the result page

**Expected Results:**
- ❌ No "Deine persönliche Einordnung von AMY" section
- ✅ Stress scores still displayed correctly
- ✅ No Anthropic API calls in console

**Restore:**
```bash
NEXT_PUBLIC_FEATURE_AMY_ENABLED=true
```

#### Test Case 2: Clinician Dashboard Toggle

**Setup:**
```bash
NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED=false
```

**Steps:**
1. Restart development server
2. Login as a clinician user
3. Attempt to access `/clinician`

**Expected Results:**
- ❌ Redirected to homepage
- ✅ Error message displayed: "Das Kliniker-Dashboard ist derzeit nicht verfügbar"
- ✅ Middleware logs: "[AUTH] Clinician dashboard feature is disabled"
- ✅ Clinician can still access patient portal

**Restore:**
```bash
NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED=true
```

#### Test Case 3: Charts Toggle

**Setup:**
```bash
NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=false
```

**Steps:**
1. Restart development server
2. Login as clinician
3. Navigate to patient detail page (`/clinician/patient/{id}`)

**Expected Results:**
- ❌ No "Stress-Verlauf" chart section
- ❌ No "Schlaf-Verlauf" chart section
- ✅ Patient profile information still visible
- ✅ AMY reports timeline still visible (if AMY_ENABLED)
- ✅ Raw data section still accessible

**Restore:**
```bash
NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=true
```

#### Test Case 4: All Features Disabled

**Setup:**
```bash
NEXT_PUBLIC_FEATURE_AMY_ENABLED=false
NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED=false
NEXT_PUBLIC_FEATURE_CHARTS_ENABLED=false
```

**Steps:**
1. Restart development server
2. Complete patient flow
3. Attempt clinician access

**Expected Results:**
- ✅ Patient can complete stress assessment
- ✅ Patient sees basic stress scores (no AMY)
- ❌ Clinician dashboard inaccessible
- ✅ Application remains functional for patient use

### Automated Testing

While there is no formal test suite, you can validate feature flags programmatically:

```typescript
import { featureFlags, getAllFeatureFlags } from '@/lib/featureFlags'

// Log all flags
console.log('Current feature flags:', getAllFeatureFlags())

// Check specific flag
if (featureFlags.AMY_ENABLED) {
  console.log('AMY is enabled')
} else {
  console.log('AMY is disabled')
}
```

## Best Practices

### Development

1. **Always provide default values**: All flags default to `true` for backward compatibility
2. **Use descriptive naming**: Follow the pattern `NEXT_PUBLIC_FEATURE_{FEATURE}_ENABLED`
3. **Document behavior**: Update this document when adding new flags
4. **Test both states**: Always test with feature enabled and disabled

### Production

1. **Environment-specific configuration**: Use different flags per environment
2. **Gradual rollout**: Disable features temporarily for staged deployment
3. **Monitor logs**: Check middleware logs for feature-disabled events
4. **Clear communication**: Inform users when features are temporarily disabled

### Adding New Feature Flags

1. **Update `lib/featureFlags.ts`**:
   ```typescript
   export type FeatureFlags = {
     // ... existing flags
     NEW_FEATURE_ENABLED: boolean
   }
   
   export const featureFlags: FeatureFlags = {
     // ... existing flags
     NEW_FEATURE_ENABLED: parseEnvBoolean(
       process.env.NEXT_PUBLIC_FEATURE_NEW_FEATURE_ENABLED,
       true
     ),
   }
   ```

2. **Update README.md**: Add to environment variables section

3. **Update this document**: Add to feature-specific behavior section

4. **Implement feature checks**: Add conditional rendering in components

5. **Test thoroughly**: Test both enabled and disabled states

## Troubleshooting

### Flag not working

**Problem**: Feature flag doesn't seem to affect behavior

**Solutions**:
1. Check environment variable name matches exactly (case-sensitive prefix)
2. Restart development server after changing `.env.local`
3. Verify browser cache is cleared
4. Check console for feature flag values: `console.log(featureFlags)`

### Build errors

**Problem**: Build fails when features are disabled

**Solutions**:
1. This is expected in CI environments without Supabase credentials
2. Feature flags don't affect build-time errors
3. Ensure all required environment variables are set for build

### Inconsistent behavior

**Problem**: Feature appears enabled in some places but not others

**Solutions**:
1. Server-side and client-side flags are evaluated separately
2. Middleware uses direct env parsing (no shared state)
3. Ensure all implementations check the same flag
4. Clear Next.js cache: `rm -rf .next`

## Migration Notes

### From No Feature Flags

When enabling feature flags in an existing deployment:

1. **No changes required**: All flags default to `true`
2. **Gradual adoption**: Enable flags one at a time
3. **Monitor impact**: Check logs for feature usage
4. **Communicate changes**: Inform team of new configuration options

### Rollback Strategy

To completely disable feature flags:

1. Remove all `NEXT_PUBLIC_FEATURE_*` from environment
2. Features will use default `true` values
3. Application behaves as if feature flags don't exist

## Security Considerations

1. **No sensitive data**: Feature flags contain no secrets
2. **Client-side exposure**: All flags use `NEXT_PUBLIC_` prefix (intentionally exposed)
3. **Middleware protection**: Critical features (like clinician dashboard) have additional auth checks
4. **Logging**: Feature-disabled events are logged but contain no sensitive data

## Support

For issues or questions about feature flags:

1. Check this documentation
2. Review `lib/featureFlags.ts` implementation
3. Check middleware logs for runtime behavior
4. Contact development team with specific flag name and observed behavior
