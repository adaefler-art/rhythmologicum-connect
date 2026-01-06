-- Migration: V05-I08.3 - Device Shipment Tracking System
-- Description: Implements shipment status tracking, return tracking, and reminder events
-- Date: 2026-01-06
-- Related Issue: V05-I08.3 — Logistics: Test/Device Versandstatus + Rücklauf + Reminders

-- ============================================================
-- 1. CREATE ENUM: shipment_status
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'shipment_status'
          AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.shipment_status AS ENUM (
            'ordered',
            'shipped',
            'in_transit',
            'delivered',
            'returned',
            'cancelled'
        );
    END IF;
END $$;

ALTER TYPE public.shipment_status OWNER TO postgres;

COMMENT ON TYPE public.shipment_status IS 'V05-I08.3: Device shipment lifecycle status';

-- ============================================================
-- 2. CREATE TABLE: device_shipments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.device_shipments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign Keys
    patient_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Shipment Details
    device_type TEXT NOT NULL,
    device_serial_number TEXT,
    
    -- Tracking Information
    tracking_number TEXT,
    carrier TEXT,
    shipping_address TEXT,
    
    -- Status Tracking
    status public.shipment_status DEFAULT 'ordered' NOT NULL,
    
    -- Dates
    ordered_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    expected_delivery_at TIMESTAMP WITH TIME ZONE,
    return_requested_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    
    -- Return Tracking
    return_tracking_number TEXT,
    return_carrier TEXT,
    return_reason TEXT,
    
    -- Reminder Tracking
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    last_reminder_at TIMESTAMP WITH TIME ZONE,
    reminder_count INTEGER DEFAULT 0 NOT NULL,
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.device_shipments OWNER TO postgres;

COMMENT ON TABLE public.device_shipments IS 'V05-I08.3: Device shipment tracking with status, return tracking, and reminder management';

COMMENT ON COLUMN public.device_shipments.organization_id IS 'Organization for multi-tenant isolation. Set server-side.';
COMMENT ON COLUMN public.device_shipments.tracking_number IS 'Carrier tracking number for outbound shipment';
COMMENT ON COLUMN public.device_shipments.return_tracking_number IS 'Carrier tracking number for return shipment';
COMMENT ON COLUMN public.device_shipments.reminder_count IS 'Number of reminders sent for this shipment';
COMMENT ON COLUMN public.device_shipments.metadata IS 'Additional shipment data (JSONB)';

-- ============================================================
-- 3. CREATE TABLE: shipment_events
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shipment_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign Keys
    shipment_id UUID NOT NULL REFERENCES device_shipments(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Event Details
    event_type TEXT NOT NULL,
    event_status public.shipment_status,
    event_description TEXT,
    
    -- Event Metadata
    location TEXT,
    carrier TEXT,
    tracking_number TEXT,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    
    -- Timestamp
    event_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.shipment_events OWNER TO postgres;

COMMENT ON TABLE public.shipment_events IS 'V05-I08.3: Event log for shipment lifecycle tracking';

COMMENT ON COLUMN public.shipment_events.event_type IS 'Event type (status_changed, tracking_updated, reminder_sent, note_added, etc.)';
COMMENT ON COLUMN public.shipment_events.event_status IS 'Shipment status at time of event (nullable for non-status events)';

-- ============================================================
-- 4. CREATE INDEXES
-- ============================================================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_device_shipments_patient_id ON public.device_shipments(patient_id);
CREATE INDEX IF NOT EXISTS idx_device_shipments_task_id ON public.device_shipments(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_device_shipments_organization_id ON public.device_shipments(organization_id);
CREATE INDEX IF NOT EXISTS idx_device_shipments_status ON public.device_shipments(status);
CREATE INDEX IF NOT EXISTS idx_device_shipments_tracking_number ON public.device_shipments(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_device_shipments_created_at_desc ON public.device_shipments(created_at DESC);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_device_shipments_org_status ON public.device_shipments(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_device_shipments_org_created ON public.device_shipments(organization_id, created_at DESC);

-- Reminder query optimization: org + status + expected_delivery for overdue shipments
CREATE INDEX IF NOT EXISTS idx_device_shipments_reminder_query 
ON public.device_shipments(organization_id, status, expected_delivery_at) 
WHERE expected_delivery_at IS NOT NULL 
AND status NOT IN ('delivered', 'returned', 'cancelled');

-- Shipment events indexes
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id ON public.shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_event_at_desc ON public.shipment_events(event_at DESC);

-- ============================================================
-- 5. CREATE RLS POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE public.device_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

-- Device Shipments Policies

-- Staff (clinician/nurse/admin) can view all shipments in their organization
DROP POLICY IF EXISTS device_shipments_select_staff_org ON public.device_shipments;
CREATE POLICY device_shipments_select_staff_org
ON public.device_shipments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.user_org_membership uom
        WHERE uom.user_id = auth.uid()
          AND uom.is_active = true
          AND uom.organization_id = device_shipments.organization_id
          AND uom.role IN ('clinician', 'nurse', 'admin')
    )
);

-- Patients can view their own shipments
DROP POLICY IF EXISTS device_shipments_select_own_patient ON public.device_shipments;
CREATE POLICY device_shipments_select_own_patient
ON public.device_shipments
FOR SELECT
TO authenticated
USING (
    patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    )
);

-- Only clinicians and admins can insert shipments
DROP POLICY IF EXISTS device_shipments_insert_staff ON public.device_shipments;
CREATE POLICY device_shipments_insert_staff
ON public.device_shipments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.user_org_membership uom
        WHERE uom.user_id = auth.uid()
          AND uom.is_active = true
          AND uom.organization_id = device_shipments.organization_id
          AND uom.role IN ('clinician', 'admin')
    )
);

-- Only staff in same org can update shipments
DROP POLICY IF EXISTS device_shipments_update_staff_org ON public.device_shipments;
CREATE POLICY device_shipments_update_staff_org
ON public.device_shipments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.user_org_membership uom
        WHERE uom.user_id = auth.uid()
          AND uom.is_active = true
          AND uom.organization_id = device_shipments.organization_id
          AND uom.role IN ('clinician', 'nurse', 'admin')
    )
);

-- Only admins can delete shipments
DROP POLICY IF EXISTS device_shipments_delete_admin ON public.device_shipments;
CREATE POLICY device_shipments_delete_admin
ON public.device_shipments
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.user_org_membership uom
        WHERE uom.user_id = auth.uid()
          AND uom.is_active = true
          AND uom.organization_id = device_shipments.organization_id
          AND uom.role = 'admin'
    )
);

-- Shipment Events Policies

-- Staff can view events for shipments in their organization
DROP POLICY IF EXISTS shipment_events_select_staff_org ON public.shipment_events;
CREATE POLICY shipment_events_select_staff_org
ON public.shipment_events
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.device_shipments ds
        JOIN public.user_org_membership uom
          ON uom.organization_id = ds.organization_id
        WHERE ds.id = shipment_events.shipment_id
          AND uom.user_id = auth.uid()
          AND uom.is_active = true
          AND uom.role IN ('clinician', 'nurse', 'admin')
    )
);

-- Patients can view events for their own shipments
DROP POLICY IF EXISTS shipment_events_select_own_patient ON public.shipment_events;
CREATE POLICY shipment_events_select_own_patient
ON public.shipment_events
FOR SELECT
TO authenticated
USING (
    shipment_id IN (
        SELECT id FROM device_shipments 
        WHERE patient_id IN (
            SELECT id FROM patient_profiles WHERE user_id = auth.uid()
        )
    )
);

-- Staff can insert events
DROP POLICY IF EXISTS shipment_events_insert_staff ON public.shipment_events;
CREATE POLICY shipment_events_insert_staff
ON public.shipment_events
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.device_shipments ds
        JOIN public.user_org_membership uom
          ON uom.organization_id = ds.organization_id
        WHERE ds.id = shipment_events.shipment_id
          AND uom.user_id = auth.uid()
          AND uom.is_active = true
          AND uom.role IN ('clinician', 'nurse', 'admin')
    )
);

-- Prevent UPDATE on shipment_events (append-only audit log)
DROP POLICY IF EXISTS shipment_events_no_update ON public.shipment_events;
CREATE POLICY shipment_events_no_update
ON public.shipment_events
FOR UPDATE
TO authenticated
USING (false);

-- Prevent DELETE on shipment_events (append-only audit log)
DROP POLICY IF EXISTS shipment_events_no_delete ON public.shipment_events;
CREATE POLICY shipment_events_no_delete
ON public.shipment_events
FOR DELETE
TO authenticated
USING (false);

-- ============================================================
-- 6. CREATE TRIGGERS AND FUNCTIONS
-- ============================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_device_shipments_updated_at ON public.device_shipments;
CREATE TRIGGER trigger_device_shipments_updated_at
    BEFORE UPDATE ON public.device_shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_device_shipments_updated_at();

-- Trigger to create shipment event on status change
CREATE OR REPLACE FUNCTION create_shipment_status_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create event if status actually changed
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.shipment_events (
            shipment_id,
            created_by_user_id,
            event_type,
            event_status,
            event_description,
            event_at
        ) VALUES (
            NEW.id,
            auth.uid(),
            'status_changed',
            NEW.status,
            'Status changed from ' || OLD.status || ' to ' || NEW.status,
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_shipment_status_event ON public.device_shipments;
CREATE TRIGGER trigger_shipment_status_event
    AFTER UPDATE ON public.device_shipments
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION create_shipment_status_event();

-- Atomic reminder count increment function
-- Prevents race conditions on concurrent reminder runs
CREATE OR REPLACE FUNCTION increment_reminder_count_atomic(
    p_shipment_id UUID,
    p_reminder_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rows_affected INTEGER;
BEGIN
    -- Atomically update reminder tracking
    -- Only succeeds if reminder wasn't sent in last 7 days
    UPDATE public.device_shipments
    SET 
        last_reminder_at = p_reminder_timestamp,
        reminder_count = COALESCE(reminder_count, 0) + 1
    WHERE 
        id = p_shipment_id
        AND (
            last_reminder_at IS NULL 
            OR last_reminder_at < (p_reminder_timestamp - INTERVAL '7 days')
        );
    
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    
    -- Return true if update succeeded (reminder should be sent)
    -- Return false if no rows updated (reminder was already sent)
    RETURN v_rows_affected > 0;
END;
$$;

COMMENT ON FUNCTION increment_reminder_count_atomic IS 'V05-I08.3: Atomically increment reminder count with 7-day cooldown check to prevent concurrent duplicate reminders';

-- ============================================================
-- 7. GRANTS
-- ============================================================

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON public.device_shipments TO authenticated;
GRANT SELECT, INSERT ON public.shipment_events TO authenticated;
GRANT DELETE ON public.device_shipments TO authenticated; -- RLS controls actual deletion
