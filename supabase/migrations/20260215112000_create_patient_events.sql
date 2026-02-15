-- Migration: Create patient_events telemetry table for KPI tracking
-- Description: Stores low-cardinality patient lifecycle and review flow events for Studio metrics

BEGIN;

CREATE TABLE IF NOT EXISTS public.patient_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NULL REFERENCES public.patient_profiles(id) ON DELETE SET NULL,
  intake_id uuid NULL REFERENCES public.clinical_intakes(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT patient_events_event_type_check CHECK (
    event_type IN (
      'session_start',
      'session_end',
      'followup_question_shown',
      'followup_answered',
      'followup_skipped',
      'intake_regen_triggered',
      'hard_stop_triggered',
      'override_set',
      'review_created',
      'upload_requested',
      'upload_received'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_patient_events_created_at
  ON public.patient_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_events_event_type_created_at
  ON public.patient_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_events_patient_created_at
  ON public.patient_events(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_events_intake_created_at
  ON public.patient_events(intake_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_patient_events_request_id
  ON public.patient_events(request_id)
  WHERE request_id IS NOT NULL;

ALTER TABLE public.patient_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient_events_select_own_or_staff" ON public.patient_events;
CREATE POLICY "patient_events_select_own_or_staff"
  ON public.patient_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.patient_profiles pp
      WHERE pp.id = patient_events.patient_id
        AND pp.user_id = auth.uid()
    )
    OR (auth.jwt() ->> 'role') IN ('clinician', 'admin', 'nurse')
  );

DROP POLICY IF EXISTS "patient_events_insert_authenticated" ON public.patient_events;
CREATE POLICY "patient_events_insert_authenticated"
  ON public.patient_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT ON public.patient_events TO authenticated;

COMMIT;
