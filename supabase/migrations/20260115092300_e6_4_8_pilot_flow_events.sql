-- E6.4.8: Pilot Flow Events (Minimal Telemetry)
-- 
-- Purpose: Track state transitions for Triage, Funnel, Workup, and Escalation flows
-- for pilot observability and debuggability.
--
-- Design Principles:
-- - Append-only event log (no updates/deletes)
-- - PHI-safe: no free text, no raw symptoms, no prompt dumps
-- - Bounded payload size to prevent bloat
-- - Best-effort: failures should not block application flows

-- Event type enumeration
DO $$ BEGIN
  CREATE TYPE public.pilot_event_type AS ENUM (
    'TRIAGE_SUBMITTED',
    'TRIAGE_ROUTED',
    'FUNNEL_STARTED',
    'FUNNEL_RESUMED',
    'FUNNEL_COMPLETED',
    'WORKUP_STARTED',
    'WORKUP_NEEDS_MORE_DATA',
    'WORKUP_READY_FOR_REVIEW',
    'ESCALATION_OFFER_SHOWN',
    'ESCALATION_OFFER_CLICKED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE public.pilot_event_type IS 'E6.4.8: Event types for pilot flow state transitions';

-- Pilot flow events table
CREATE TABLE IF NOT EXISTS public.pilot_flow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Context identifiers
  org_id uuid,
  patient_id uuid,
  actor_role public.user_role,
  
  -- Correlation and tracking
  correlation_id text NOT NULL,
  
  -- Event classification
  event_type public.pilot_event_type NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  
  -- State transition
  from_state text,
  to_state text,
  
  -- PHI-safe metadata (max 2KB enforced by constraint)
  payload_json jsonb DEFAULT '{}'::jsonb,
  payload_hash text,
  
  -- Ensure correlation_id format (bounded length)
  CONSTRAINT pilot_flow_events_correlation_id_length CHECK (length(correlation_id) <= 64),
  
  -- Ensure payload size is bounded (approx 2KB limit)
  CONSTRAINT pilot_flow_events_payload_size CHECK (
    pg_column_size(payload_json) <= 2048
  )
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_pilot_flow_events_created_at 
  ON public.pilot_flow_events(created_at DESC, id ASC);

CREATE INDEX IF NOT EXISTS idx_pilot_flow_events_patient_id 
  ON public.pilot_flow_events(patient_id, created_at DESC) 
  WHERE patient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pilot_flow_events_correlation_id 
  ON public.pilot_flow_events(correlation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_flow_events_entity 
  ON public.pilot_flow_events(entity_type, entity_id, created_at DESC);

-- Table metadata
ALTER TABLE public.pilot_flow_events OWNER TO postgres;

COMMENT ON TABLE public.pilot_flow_events IS 
  'E6.4.8: Append-only event log for pilot flow state transitions. '
  'PHI-safe telemetry for debugging and audit purposes.';

COMMENT ON COLUMN public.pilot_flow_events.correlation_id IS 
  'Unique correlation ID for tracing requests across flows (max 64 chars)';

COMMENT ON COLUMN public.pilot_flow_events.event_type IS 
  'Type of state transition event (triage, funnel, workup, escalation)';

COMMENT ON COLUMN public.pilot_flow_events.entity_type IS 
  'Type of entity (e.g., "triage", "funnel", "workup", "assessment")';

COMMENT ON COLUMN public.pilot_flow_events.entity_id IS 
  'UUID or identifier of the entity';

COMMENT ON COLUMN public.pilot_flow_events.from_state IS 
  'Previous state before transition (nullable for initial events)';

COMMENT ON COLUMN public.pilot_flow_events.to_state IS 
  'New state after transition (nullable for final events)';

COMMENT ON COLUMN public.pilot_flow_events.payload_json IS 
  'PHI-safe metadata: allowlist keys only (nextAction, tier, redFlag booleans, counts, stable identifiers). '
  'Max size: 2KB. Include payloadVersion field for schema evolution.';

COMMENT ON COLUMN public.pilot_flow_events.payload_hash IS 
  'Optional deterministic hash of payload for integrity verification';

-- RLS Policies: Admin and clinician access only
ALTER TABLE public.pilot_flow_events ENABLE ROW LEVEL SECURITY;

-- Policy: Admin and clinician read access
CREATE POLICY pilot_flow_events_admin_read 
  ON public.pilot_flow_events 
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'clinician')
  );

-- Policy: System insert only (no user writes directly)
CREATE POLICY pilot_flow_events_system_insert 
  ON public.pilot_flow_events 
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Note: No UPDATE or DELETE policies - append-only table

COMMENT ON POLICY pilot_flow_events_admin_read ON public.pilot_flow_events IS 
  'E6.4.8: Only admins and clinicians can read pilot flow events';

COMMENT ON POLICY pilot_flow_events_system_insert ON public.pilot_flow_events IS 
  'E6.4.8: All authenticated users can insert events (system-level operation)';
