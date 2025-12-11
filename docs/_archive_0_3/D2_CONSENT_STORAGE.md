# D2: Consent Data Storage Implementation

## Overview

This implementation provides a versioned consent management system for storing user consent to terms and conditions. The system ensures that each patient can consent to a specific version exactly once, with proper audit trails and Row-Level Security (RLS) policies.

## Database Schema

### Table: `user_consents`

Located in `public` schema with the following structure:

```sql
CREATE TABLE public.user_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    consent_version text NOT NULL,
    consented_at timestamptz DEFAULT now() NOT NULL,
    ip_address text,
    user_agent text,
    CONSTRAINT user_consents_user_id_consent_version_key UNIQUE (user_id, consent_version),
    CONSTRAINT user_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

**Columns:**
- `id`: Unique identifier for the consent record
- `user_id`: Reference to auth.users, identifies who gave consent
- `consent_version`: Version string (e.g., "1.0.0") matching `CONSENT_VERSION` in `lib/consentConfig.ts`
- `consented_at`: Timestamp when consent was given
- `ip_address`: IP address of the user when consent was given (for audit trail)
- `user_agent`: Browser user agent string (for audit trail)

**Constraints:**
- Primary key on `id`
- Unique constraint on `(user_id, consent_version)` - ensures one consent per user per version
- Foreign key to `auth.users` with CASCADE delete

**Indexes:**
- `idx_user_consents_user_id` on `user_id` for efficient lookups
- `idx_user_consents_consented_at` on `consented_at DESC` for chronological queries

## Row-Level Security (RLS)

RLS is enabled on `user_consents` with three policies:

1. **Users can view own consents**
   - Policy: `FOR SELECT USING (auth.uid() = user_id)`
   - Users can only see their own consent records

2. **Users can insert own consents**
   - Policy: `FOR INSERT WITH CHECK (auth.uid() = user_id)`
   - Users can only insert consent records for themselves

3. **Clinicians can view all consents**
   - Policy: `FOR SELECT` for users with role='clinician'
   - Clinicians can view all patient consent records

## API Endpoints

### POST `/api/consent/record`

Records a user's consent to a specific version.

**Request:**
```json
{
  "consentVersion": "1.0.0"
}
```

**Response (201):**
```json
{
  "success": true,
  "consent": {
    "id": "uuid",
    "consentVersion": "1.0.0",
    "consentedAt": "2025-12-07T10:30:00Z"
  }
}
```

**Error Responses:**
- `400`: Missing or invalid consentVersion
- `401`: Not authenticated
- `409`: Consent already recorded for this version
- `500`: Server error

**Server-side features:**
- Automatically captures IP address from request headers (`x-forwarded-for`, `x-real-ip`)
- Automatically captures user agent from request headers
- Validates authentication using Supabase server client
- Prevents duplicate consents (unique constraint)

### GET `/api/consent/status?version=1.0.0`

Checks if the current user has consented to a specific version.

**Query Parameters:**
- `version` (required): The consent version to check

**Response (200):**
```json
{
  "hasConsent": true,
  "consent": {
    "id": "uuid",
    "consentVersion": "1.0.0",
    "consentedAt": "2025-12-07T10:30:00Z"
  }
}
```

Or if no consent:
```json
{
  "hasConsent": false
}
```

**Error Responses:**
- `400`: Missing version parameter
- `401`: Not authenticated
- `500`: Server error

## Frontend Components

### ConsentModal Component

Located at `app/patient/stress-check/ConsentModal.tsx`

**Usage:**
```tsx
<ConsentModal
  onConsent={() => {/* Handle consent accepted */}}
  onDecline={() => {/* Handle consent declined */}}
/>
```

**Features:**
- Displays versioned consent text from `lib/consentConfig.ts`
- Requires checkbox acceptance before submission
- Uses `/api/consent/record` endpoint (not direct Supabase access)
- Shows loading state during submission
- Displays error messages if consent recording fails

### Consent Configuration

Located at `lib/consentConfig.ts`

**Configuration:**
```typescript
export const CONSENT_VERSION = '1.0.0'  // Update to re-request consent

export const CONSENT_TEXT = {
  title: 'Nutzungsbedingungen & Datenschutz',
  sections: [/* consent sections */],
  checkboxText: 'acceptance text',
  buttons: {
    accept: 'Akzeptieren & fortfahren',
    decline: 'Ablehnen'
  }
}
```

**To update consent:**
1. Change `CONSENT_VERSION` to a new version (e.g., "1.1.0")
2. Update `CONSENT_TEXT.sections` as needed
3. All users will be prompted to accept the new version on next visit

## Migration

Migration file: `supabase/migrations/20251207074557_create_user_consents_table.sql`

The migration follows repository best practices:
- Uses `CREATE TABLE IF NOT EXISTS` for idempotency
- Uses `DO $$ ... END $$` blocks for constraints and policies
- Checks for existing constraints/policies before creating
- Includes comprehensive comments on table and columns
- Includes all necessary indexes

**Running the migration:**
```bash
# Apply migration locally
supabase db reset

# Or apply specific migration
supabase migration up
```

## Security Considerations

1. **Server-side API**: Consent recording goes through API endpoint, not direct client access
   - Ensures proper IP address capture (from server request headers)
   - Prevents client-side manipulation of IP addresses
   - Validates authentication server-side

2. **RLS Policies**: Users can only access their own consent records
   - Prevents unauthorized access to other users' consents
   - Clinicians have read access for monitoring

3. **Unique Constraint**: Prevents duplicate consents
   - Database enforces one consent per user per version
   - API returns 409 status for duplicate attempts

4. **Audit Trail**: IP address and user agent are recorded
   - Provides evidence of when and where consent was given
   - Useful for compliance and dispute resolution

## Usage Example

### Checking consent before showing content

```typescript
// In a page component
useEffect(() => {
  const checkConsent = async () => {
    const response = await fetch('/api/consent/status?version=1.0.0')
    const data = await response.json()
    
    if (!data.hasConsent) {
      setShowConsentModal(true)
    }
  }
  
  checkConsent()
}, [])
```

### Recording consent

```typescript
// Using the API endpoint
const recordConsent = async () => {
  const response = await fetch('/api/consent/record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consentVersion: '1.0.0' })
  })
  
  if (response.ok) {
    // Consent recorded successfully
  }
}
```

## Acceptance Criteria Met

✅ **Table `user_consents`**: Created with patient_id (user_id), text_version (consent_version), timestamp (consented_at)
✅ **One consent per version**: Enforced by UNIQUE constraint on (user_id, consent_version)
✅ **API can retrieve consent status**: `/api/consent/status` endpoint available
✅ **RLS prevents access to foreign data**: Policies ensure users only access their own consents

## Future Enhancements

Potential improvements for future iterations:

1. **Consent withdrawal**: Add API endpoint to revoke consent
2. **Consent history**: Show users their consent history
3. **Admin dashboard**: Allow administrators to view consent statistics
4. **Consent export**: Generate compliance reports
5. **Multi-language support**: Support consent text in multiple languages
