-- Migration: V05-I05.9 - Delivery System (MVP)
-- Description: Creates delivery state machine, notifications table, and follow-up infrastructure
--              Status-driven delivery with consent-aware notifications (in-app MVP)
-- Author: GitHub Copilot
-- Date: 2026-01-04
-- Issue: V05-I05.9

-- ============================================================
-- SECTION 1: CREATE NOTIFICATION STATUS ENUM
-- ============================================================

-- Notification status enum for tracking delivery state
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE public.notification_status AS ENUM (
            'PENDING',
            'SENT',
            'DELIVERED',
            'READ',
            'FAILED',
            'CANCELLED'
        );
    END IF;
END $$;

COMMENT ON TYPE public.notification_status IS 'V05-I05.9: Notification delivery status';

-- ============================================================
-- SECTION 2: ADD DELIVERY FIELDS TO PROCESSING_JOBS
-- ============================================================

-- Add delivery status and metadata to processing_jobs
-- Delivery state machine: NOT_READY → READY → DELIVERED (or FAILED)

DO $$ 
BEGIN
    -- Add delivery_status column (stores current delivery state)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'processing_jobs' 
        AND column_name = 'delivery_status'
    ) THEN
        ALTER TABLE public.processing_jobs 
        ADD COLUMN delivery_status TEXT NOT NULL DEFAULT 'NOT_READY'
        CHECK (delivery_status IN ('NOT_READY', 'READY', 'DELIVERED', 'FAILED'));
    END IF;

    -- Add delivery_timestamp (when delivery was completed)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'processing_jobs' 
        AND column_name = 'delivery_timestamp'
    ) THEN
        ALTER TABLE public.processing_jobs 
        ADD COLUMN delivery_timestamp TIMESTAMPTZ;
    END IF;

    -- Add delivery_metadata (PHI-free metadata about delivery)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'processing_jobs' 
        AND column_name = 'delivery_metadata'
    ) THEN
        ALTER TABLE public.processing_jobs 
        ADD COLUMN delivery_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add delivery_attempt (for retry tracking)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'processing_jobs' 
        AND column_name = 'delivery_attempt'
    ) THEN
        ALTER TABLE public.processing_jobs 
        ADD COLUMN delivery_attempt INTEGER NOT NULL DEFAULT 0 
        CHECK (delivery_attempt >= 0 AND delivery_attempt <= 5);
    END IF;
END $$;

COMMENT ON COLUMN public.processing_jobs.delivery_status IS 'V05-I05.9: Delivery state (NOT_READY, READY, DELIVERED, FAILED)';
COMMENT ON COLUMN public.processing_jobs.delivery_timestamp IS 'V05-I05.9: When delivery was completed (NULL if not delivered)';
COMMENT ON COLUMN public.processing_jobs.delivery_metadata IS 'V05-I05.9: PHI-free delivery metadata (notification IDs, errors)';
COMMENT ON COLUMN public.processing_jobs.delivery_attempt IS 'V05-I05.9: Delivery retry attempt counter (0-5)';

-- ============================================================
-- SECTION 3: CREATE NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User reference (who receives this notification)
    user_id UUID NOT NULL,
    
    -- Related entity references (optional, for context)
    job_id UUID,
    assessment_id UUID,
    
    -- Notification type (e.g., 'REPORT_READY', 'REVIEW_REQUESTED', 'ACTION_REQUIRED')
    notification_type TEXT NOT NULL,
    
    -- Status (PENDING → SENT/DELIVERED → READ)
    status public.notification_status NOT NULL DEFAULT 'PENDING',
    
    -- Channel (in-app, email, sms - MVP is in-app only)
    channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'sms')),
    
    -- Priority (low, medium, high, urgent)
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- PHI-free message content (subject and body)
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Additional PHI-free metadata (links, actions, etc.)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Consent tracking (was user consent verified before sending?)
    consent_verified BOOLEAN NOT NULL DEFAULT FALSE,
    consent_version TEXT,
    
    -- Delivery tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    -- Error tracking (PHI-free)
    error_message TEXT,
    
    -- Follow-up tracking (for sequences)
    follow_up_at TIMESTAMPTZ,
    follow_up_completed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Expiration (optional, for time-limited notifications)
    expires_at TIMESTAMPTZ,
    
    -- Constraints
    CHECK (
        (status = 'SENT' AND sent_at IS NOT NULL) OR 
        (status != 'SENT')
    ),
    CHECK (
        (status = 'DELIVERED' AND delivered_at IS NOT NULL) OR 
        (status != 'DELIVERED')
    ),
    CHECK (
        (status = 'READ' AND read_at IS NOT NULL) OR 
        (status != 'READ')
    ),
    CHECK (
        (status = 'FAILED' AND failed_at IS NOT NULL AND error_message IS NOT NULL) OR 
        (status != 'FAILED')
    )
);

-- Table and column comments
COMMENT ON TABLE public.notifications IS 'V05-I05.9: Notification delivery system (in-app + email infrastructure)';
COMMENT ON COLUMN public.notifications.id IS 'Notification unique identifier';
COMMENT ON COLUMN public.notifications.user_id IS 'Recipient user ID';
COMMENT ON COLUMN public.notifications.job_id IS 'Related processing job (optional)';
COMMENT ON COLUMN public.notifications.assessment_id IS 'Related assessment (optional)';
COMMENT ON COLUMN public.notifications.notification_type IS 'Type: REPORT_READY, REVIEW_REQUESTED, ACTION_REQUIRED, etc.';
COMMENT ON COLUMN public.notifications.status IS 'Delivery status (PENDING → SENT → DELIVERED → READ)';
COMMENT ON COLUMN public.notifications.channel IS 'Delivery channel (in_app, email, sms)';
COMMENT ON COLUMN public.notifications.priority IS 'Priority level (low, medium, high, urgent)';
COMMENT ON COLUMN public.notifications.subject IS 'PHI-free notification subject';
COMMENT ON COLUMN public.notifications.message IS 'PHI-free notification message body';
COMMENT ON COLUMN public.notifications.metadata IS 'PHI-free metadata (links, actions, etc.)';
COMMENT ON COLUMN public.notifications.consent_verified IS 'Was user consent verified before sending?';
COMMENT ON COLUMN public.notifications.consent_version IS 'Version of consent that was verified';
COMMENT ON COLUMN public.notifications.follow_up_at IS 'When to trigger follow-up action (NULL if no follow-up)';
COMMENT ON COLUMN public.notifications.follow_up_completed IS 'Has follow-up been completed?';
COMMENT ON COLUMN public.notifications.expires_at IS 'When notification expires (optional)';

-- ============================================================
-- SECTION 4: CREATE INDEXES
-- ============================================================

-- Index for finding jobs by delivery status (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_processing_jobs_delivery_status 
ON public.processing_jobs(delivery_status) 
WHERE delivery_status IN ('READY', 'DELIVERED');

-- Index for finding recently delivered jobs
CREATE INDEX IF NOT EXISTS idx_processing_jobs_delivery_timestamp 
ON public.processing_jobs(delivery_timestamp DESC) 
WHERE delivery_timestamp IS NOT NULL;

-- Index for finding jobs ready for delivery
CREATE INDEX IF NOT EXISTS idx_processing_jobs_ready_for_delivery 
ON public.processing_jobs(status, stage, delivery_status) 
WHERE status = 'completed' AND stage = 'completed' AND delivery_status = 'NOT_READY';

-- Index for user notifications (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications(user_id, created_at DESC);

-- Index for pending notifications (for processing)
CREATE INDEX IF NOT EXISTS idx_notifications_pending 
ON public.notifications(status, created_at) 
WHERE status = 'PENDING';

-- Index for follow-up notifications
CREATE INDEX IF NOT EXISTS idx_notifications_follow_up 
ON public.notifications(follow_up_at) 
WHERE follow_up_at IS NOT NULL AND follow_up_completed = FALSE;

-- Index for job-related notifications
CREATE INDEX IF NOT EXISTS idx_notifications_job_id 
ON public.notifications(job_id) 
WHERE job_id IS NOT NULL;

-- ============================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY notifications_select_own 
ON public.notifications 
FOR SELECT 
USING (
    auth.uid() = user_id
);

-- Policy: Clinicians/admins can view all notifications
CREATE POLICY notifications_select_clinician 
ON public.notifications 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.uid() = id 
        AND (
            raw_app_meta_data->>'role' = 'clinician' 
            OR raw_app_meta_data->>'role' = 'admin'
        )
    )
);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: System can insert notifications (service role only)
-- Note: INSERT policies are typically handled by service role for notifications

-- ============================================================
-- SECTION 6: UPDATE TRIGGER FOR UPDATED_AT
-- ============================================================

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifications table
DROP TRIGGER IF EXISTS trg_notifications_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_notifications_updated_at();

-- ============================================================
-- SECTION 7: GRANTS (For app_role and authenticated users)
-- ============================================================

-- Grant SELECT to authenticated users (RLS handles filtering)
GRANT SELECT ON public.notifications TO authenticated;

-- Grant UPDATE to authenticated users (for marking as read)
GRANT UPDATE(status, read_at, updated_at) ON public.notifications TO authenticated;

-- Service role has full access (handled by Supabase defaults)

-- ============================================================
-- SECTION 8: VALIDATION & COMMENTS
-- ============================================================

COMMENT ON INDEX idx_processing_jobs_delivery_status IS 'V05-I05.9: Fast lookup of jobs by delivery status';
COMMENT ON INDEX idx_processing_jobs_delivery_timestamp IS 'V05-I05.9: Find recently delivered jobs';
COMMENT ON INDEX idx_processing_jobs_ready_for_delivery IS 'V05-I05.9: Find completed jobs ready for delivery';
COMMENT ON INDEX idx_notifications_user_created IS 'V05-I05.9: Fast lookup of user notifications by recency';
COMMENT ON INDEX idx_notifications_pending IS 'V05-I05.9: Find pending notifications to process';
COMMENT ON INDEX idx_notifications_follow_up IS 'V05-I05.9: Find notifications needing follow-up';
COMMENT ON INDEX idx_notifications_job_id IS 'V05-I05.9: Find notifications for a specific job';
