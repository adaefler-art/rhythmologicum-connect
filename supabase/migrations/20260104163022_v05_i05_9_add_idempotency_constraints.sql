-- Migration: V05-I05.9 Hardening - Add Idempotency Constraints
-- Description: Adds unique constraints for deterministic notification and delivery idempotency
-- Author: GitHub Copilot
-- Date: 2026-01-04
-- Issue: V05-I05.9 (hardening)

-- ============================================================
-- SECTION 1: ADD NOTIFICATION IDEMPOTENCY CONSTRAINT
-- ============================================================

-- Add unique constraint for notifications to prevent duplicates
-- Idempotency key: (user_id, job_id, notification_type, channel)
-- This ensures the same notification for the same job/user/type/channel is only created once

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_idempotency_key'
    ) THEN
        ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_idempotency_key 
        UNIQUE (user_id, job_id, notification_type, channel);
    END IF;
END $$;

COMMENT ON CONSTRAINT notifications_idempotency_key ON public.notifications IS 
'V05-I05.9: Idempotency constraint - prevents duplicate notifications for same user+job+type+channel';

-- ============================================================
-- SECTION 2: ADD INDEX FOR IDEMPOTENCY LOOKUP
-- ============================================================

-- Index to speed up idempotency checks
CREATE INDEX IF NOT EXISTS idx_notifications_idempotency 
ON public.notifications(user_id, job_id, notification_type, channel) 
WHERE job_id IS NOT NULL;

COMMENT ON INDEX idx_notifications_idempotency IS 
'V05-I05.9: Fast idempotency lookup for notification creation';
