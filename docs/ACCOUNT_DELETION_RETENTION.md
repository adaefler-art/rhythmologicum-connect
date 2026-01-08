# Account Deletion and Retention Workflow

## Overview

This document describes the account deletion and retention workflow for Rhythmologicum Connect, ensuring GDPR Article 17 (Right to Erasure) compliance while maintaining audit trails and data integrity.

## Legal Framework

### GDPR Article 17 - Right to Erasure ("Right to be Forgotten")

Users have the right to request deletion of their personal data. The platform must:
1. Provide a mechanism for users to request account deletion
2. Process deletion requests within 30 days
3. Maintain audit logs of deletion requests and actions
4. Handle retention requirements (e.g., legal, medical, audit purposes)

## Workflow Phases

### Phase 1: Deletion Request (MVP Implementation)

**User Actions:**
- Patient can request account deletion from their profile settings
- System captures deletion request with timestamp and reason

**System Actions:**
1. Create deletion request record
2. Log audit event: `account_deletion_request`
3. Set account status to `deletion_pending`
4. Email confirmation to user
5. Begin retention period countdown (default: 30 days)

**Database Changes:**
- Add `deletion_requested_at` timestamp to user metadata
- Add `deletion_reason` to capture user feedback
- Add `account_status` field to track lifecycle state

### Phase 2: Retention Period (30 Days)

**During Retention:**
- User can cancel deletion request
- User can still access their data (read-only recommended)
- Clinicians with active assignments notified
- System sends reminder emails (7 days before, 1 day before)

**Cancellation:**
- User can cancel via email link or account settings
- Log audit event: `account_deletion_cancelled`
- Restore account to `active` status

### Phase 3: Account Deletion Execution

**Data Handling Strategy:**

The system uses a **hybrid approach** combining hard deletion and anonymization:

#### Hard Delete:
- Personally Identifiable Information (PII)
  - Name, email, phone, address
  - IP addresses (except in audit logs)
  - User profile data
- User-generated content (optional, based on retention policy)
  - Assessment answers containing text
  - Support case notes with PHI

#### Anonymize/Retain:
- Audit logs (required for compliance)
  - Keep with anonymized user references
  - Maintain entity relationships for traceability
- Aggregated/de-identified data
  - Assessment scores (no direct identifiers)
  - Statistical data for research
- Legal/medical records (as required by law)
  - Medical device shipment records
  - Clinical review records
  - Consent records (audit trail)

**Execution Process:**
1. Final backup of user data (encrypted, time-limited)
2. Log audit event: `account_deletion_started`
3. Execute deletion/anonymization SQL transaction
4. Verify deletion completed successfully
5. Log audit event: `account_deletion_completed`
6. Send final confirmation email (to deleted email, last chance)
7. Remove email from mailing lists

### Phase 4: Post-Deletion

**Audit Trail:**
- Maintain record of deletion in audit_log
- Keep deletion request metadata (anonymized)
- Document what was deleted vs. anonymized

**Data Residuals:**
- Audit logs with `[DELETED_USER:{uuid}]` references
- Aggregated statistics
- De-identified research data

## Technical Implementation

### Database Schema Extensions

```sql
-- Account lifecycle tracking
ALTER TABLE auth.users ADD COLUMN deletion_requested_at TIMESTAMPTZ;
ALTER TABLE auth.users ADD COLUMN deletion_scheduled_for TIMESTAMPTZ;
ALTER TABLE auth.users ADD COLUMN deletion_reason TEXT;
ALTER TABLE auth.users ADD COLUMN account_status TEXT DEFAULT 'active'
  CHECK (account_status IN ('active', 'deletion_pending', 'deleted'));
```

### API Endpoints (MVP)

#### Request Account Deletion
```
POST /api/account/deletion-request
Body: {
  "reason": "optional user feedback",
  "confirm": true
}
Response: {
  "success": true,
  "deletion_scheduled_for": "2026-02-07T12:00:00Z",
  "can_cancel_until": "2026-02-07T12:00:00Z"
}
```

#### Cancel Deletion Request
```
POST /api/account/deletion-cancel
Body: {
  "confirmation_token": "from-email-link"
}
Response: {
  "success": true,
  "account_status": "active"
}
```

#### Execute Deletion (Admin/System Only)
```
POST /api/admin/account/execute-deletion
Body: {
  "user_id": "uuid",
  "admin_confirmation": true
}
Response: {
  "success": true,
  "deleted_at": "2026-02-07T12:00:00Z",
  "records_deleted": 150,
  "records_anonymized": 45
}
```

### Audit Events

All deletion lifecycle events are logged to `audit_log` table:

| Entity Type | Action | Description |
|------------|---------|-------------|
| `account` | `deletion_request` | User requested account deletion |
| `account` | `deletion_cancel` | User cancelled deletion request |
| `account` | `deletion_execute` | System executed account deletion |
| `account` | `deletion_complete` | Deletion process completed successfully |
| `account` | `anonymize` | Records anonymized instead of deleted |

**Metadata Fields:**
- `deletion_reason`: User-provided reason
- `scheduled_for`: When deletion will execute
- `retention_period_days`: Length of retention period
- `records_deleted`: Count of hard-deleted records
- `records_anonymized`: Count of anonymized records
- `initiated_by`: User ID who requested deletion
- `executed_by`: Admin/system that executed deletion

### SQL Deletion Procedure

```sql
-- Stored procedure for account deletion
CREATE OR REPLACE FUNCTION delete_user_account(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  deleted_count INT := 0;
  anonymized_count INT := 0;
BEGIN
  -- Start transaction
  BEGIN
    -- 1. Anonymize audit logs (keep structure, remove PII)
    UPDATE audit_log 
    SET actor_user_id = NULL,
        metadata = metadata || jsonb_build_object('anonymized_user', target_user_id::TEXT)
    WHERE actor_user_id = target_user_id;
    
    GET DIAGNOSTICS anonymized_count = ROW_COUNT;
    
    -- 2. Delete patient-specific data (CASCADE will handle related records)
    DELETE FROM patient_profiles WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 3. Delete auth user (final step)
    DELETE FROM auth.users WHERE id = target_user_id;
    
    -- Build result
    result := jsonb_build_object(
      'success', true,
      'user_id', target_user_id,
      'deleted_count', deleted_count,
      'anonymized_count', anonymized_count,
      'deleted_at', NOW()
    );
    
    RETURN result;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback on error
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Security Considerations

### Access Control
- Only authenticated users can request deletion of their own account
- Only admins can view deletion requests
- Only system/admin can execute deletions
- All actions logged with actor_user_id

### Data Protection
- Deletion is irreversible after retention period
- Backups are encrypted and time-limited
- Audit logs never contain PHI (redacted via `redactPHI()`)
- Email confirmations sent to prevent unauthorized deletion

### Audit Trail Integrity
- Audit logs must never be deleted (GDPR allows this)
- User references anonymized but relationships preserved
- Deletion metadata retained indefinitely for compliance

## Edge Cases

### Active Clinical Relationships
- If user has active clinician assignments:
  - Notify assigned clinicians of pending deletion
  - Allow clinician to export/archive relevant medical data
  - Maintain medical records per legal requirements

### Pending Medical Processes
- If user has:
  - Pending device shipment → Complete or cancel before deletion
  - Active support case → Resolve or anonymize
  - Pending medical review → Complete or archive

### Data Export Before Deletion
- Automatically trigger data export upon deletion request
- Email download link to user (JSON export)
- Keep export available for 30-day retention period

## MVP Scope (V05-I10.2)

For the initial implementation, we focus on:

1. ✅ **Documentation**: This workflow document
2. ✅ **Audit Events**: New entity types and actions in registry
3. ✅ **Audit Helpers**: Functions in `lib/audit/log.ts`
4. ✅ **Database Migration**: Schema extensions for deletion tracking
5. ✅ **API Endpoint**: Request deletion endpoint with audit logging
6. ⚠️ **UI**: Minimal UI in user settings (future enhancement)
7. ⚠️ **Execution**: Manual admin process (automated in future)

### Out of Scope (Future Enhancements)
- Automated deletion execution (scheduled job)
- User-facing deletion request UI
- Email notification system
- Cancellation workflow
- Complex retention policies per data type
- Integration with backup systems

## Testing Checklist

### Functional Testing
- [ ] User can request account deletion
- [ ] Deletion request is logged in audit_log
- [ ] User metadata updated with deletion timestamps
- [ ] API validates user authentication
- [ ] API prevents deletion of other users' accounts

### Security Testing
- [ ] Unauthorized users cannot access deletion endpoints
- [ ] Audit logs contain no PHI
- [ ] SQL injection protection verified
- [ ] CodeQL scan passes with zero vulnerabilities

### Compliance Testing
- [ ] Audit trail complete for deletion lifecycle
- [ ] User can export data before deletion
- [ ] Required data retained (audit logs, legal records)
- [ ] PII properly removed after deletion

## References

- GDPR Article 17: https://gdpr-info.eu/art-17-gdpr/
- GDPR Recital 65: Exceptions to right to erasure
- ISO 27001:2013 - A.8.3.2: Disposal of media
- Internal: `lib/audit/log.ts` - Audit logging framework
- Internal: `schema/schema.sql` - Database schema with CASCADE rules

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-08 | 1.0 | Initial MVP documentation (V05-I10.2) |
