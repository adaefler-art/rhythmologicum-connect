-- E6.6.6: Triage Sessions (PHI-safe persistence for pilot debugging)
--
-- Purpose: Store triage decision metadata for pilot debugging without PHI
-- 
-- Design Principles:
-- - NO raw inputText storage (AC1: PHI-safe by design)
-- - Only input_hash stored (SHA-256 for idempotency/debugging)
-- - Patient reads own sessions, clinician/admin reads all (AC2: RLS)
-- - Inserted after eligibility and validation (AC3)
-- - Bounded rationale field to prevent bloat

-- Triage sessions table
CREATE TABLE IF NOT EXISTS public.triage_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Patient context (required)
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Request tracking
  correlation_id text NOT NULL,
  
  -- Triage decision output (from TriageResultV1)
  tier text NOT NULL,
  next_action text NOT NULL,
  red_flags text[] DEFAULT ARRAY[]::text[] NOT NULL,
  
  -- PHI-safe input tracking (NO raw text)
  input_hash text NOT NULL,
  
  -- Versioning for governance
  rules_version text NOT NULL,
  
  -- Optional bounded rationale (max 280 chars from contract)
  rationale text,
  
  -- Constraints
  CONSTRAINT triage_sessions_correlation_id_length CHECK (length(correlation_id) <= 64),
  CONSTRAINT triage_sessions_tier_check CHECK (tier IN ('INFO', 'ASSESSMENT', 'ESCALATE')),
  CONSTRAINT triage_sessions_next_action_check CHECK (
    next_action IN ('SHOW_CONTENT', 'START_FUNNEL_A', 'START_FUNNEL_B', 'RESUME_FUNNEL', 'SHOW_ESCALATION')
  ),
  CONSTRAINT triage_sessions_rationale_length CHECK (
    rationale IS NULL OR length(rationale) <= 280
  ),
  CONSTRAINT triage_sessions_input_hash_check CHECK (length(input_hash) = 64)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_triage_sessions_patient_id_created_at 
  ON public.triage_sessions(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_triage_sessions_correlation_id 
  ON public.triage_sessions(correlation_id);

CREATE INDEX IF NOT EXISTS idx_triage_sessions_created_at 
  ON public.triage_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_triage_sessions_input_hash 
  ON public.triage_sessions(input_hash);

-- Table metadata
ALTER TABLE public.triage_sessions OWNER TO postgres;

COMMENT ON TABLE public.triage_sessions IS 
  'E6.6.6: Triage session persistence for pilot debugging. '
  'PHI-safe: NO raw inputText stored, only SHA-256 hash. '
  'Stores triage decision metadata for observability.';

COMMENT ON COLUMN public.triage_sessions.patient_id IS 
  'Patient who submitted the triage request';

COMMENT ON COLUMN public.triage_sessions.correlation_id IS 
  'Correlation ID for request tracing (max 64 chars)';

COMMENT ON COLUMN public.triage_sessions.tier IS 
  'Triage tier decision: INFO, ASSESSMENT, or ESCALATE';

COMMENT ON COLUMN public.triage_sessions.next_action IS 
  'Next action routing: SHOW_CONTENT, START_FUNNEL_A, START_FUNNEL_B, RESUME_FUNNEL, or SHOW_ESCALATION';

COMMENT ON COLUMN public.triage_sessions.red_flags IS 
  'Array of detected red flags from allowlist: report_risk_level, workup_check, answer_pattern';

COMMENT ON COLUMN public.triage_sessions.input_hash IS 
  'SHA-256 hash of normalized input text (64 hex chars). NO raw text stored for PHI safety.';

COMMENT ON COLUMN public.triage_sessions.rules_version IS 
  'Version of triage ruleset used (e.g., "1.0.0")';

COMMENT ON COLUMN public.triage_sessions.rationale IS 
  'Optional bounded routing rationale (max 280 chars, no PHI)';

-- RLS Policies
ALTER TABLE public.triage_sessions ENABLE ROW LEVEL SECURITY;

-- AC2: Patient can only read own triage sessions
DROP POLICY IF EXISTS triage_sessions_patient_read_own ON public.triage_sessions;
CREATE POLICY triage_sessions_patient_read_own 
  ON public.triage_sessions 
  FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid()
  );

-- AC2: Clinician/admin can read all triage sessions (pilot org only)
DROP POLICY IF EXISTS triage_sessions_clinician_admin_read_all ON public.triage_sessions;
CREATE POLICY triage_sessions_clinician_admin_read_all 
  ON public.triage_sessions 
  FOR SELECT
  TO authenticated
  USING (
    public.has_role('clinician'::text) OR public.has_role('admin'::text)
  );

-- All authenticated users can insert (system operation after triage)
DROP POLICY IF EXISTS triage_sessions_insert ON public.triage_sessions;
CREATE POLICY triage_sessions_insert 
  ON public.triage_sessions 
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

-- No UPDATE or DELETE policies - append-only table

COMMENT ON POLICY triage_sessions_patient_read_own ON public.triage_sessions IS 
  'E6.6.6 AC2: Patients can only read their own triage sessions';

COMMENT ON POLICY triage_sessions_clinician_admin_read_all ON public.triage_sessions IS 
  'E6.6.6 AC2: Clinicians and admins can read all triage sessions for pilot debugging';

COMMENT ON POLICY triage_sessions_insert ON public.triage_sessions IS 
  'E6.6.6 AC3: Authenticated users can insert triage sessions (own patient_id only)';
