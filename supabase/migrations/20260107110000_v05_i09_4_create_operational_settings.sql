-- Migration: V05-I09.4 - Operational Settings (Notification Templates, Re-assessment Rules, KPI Thresholds)
-- Description: Creates tables for managing operational settings with full audit trail
-- Author: GitHub Copilot
-- Date: 2026-01-07
-- Issue: V05-I09.4

-- ============================================================
-- SECTION 1: NOTIFICATION TEMPLATES
-- ============================================================

-- Table for reusable notification templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  channel text NOT NULL CHECK (channel IN ('in_app', 'email', 'sms')),
  subject_template text,
  body_template text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true NOT NULL,
  is_system boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_key ON public.notification_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_notification_templates_channel ON public.notification_templates(channel);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON public.notification_templates(is_active);

-- Comments
COMMENT ON TABLE public.notification_templates IS 'V05-I09.4: Reusable notification templates for system communications';
COMMENT ON COLUMN public.notification_templates.template_key IS 'Unique identifier for template (e.g., "report_ready", "followup_reminder")';
COMMENT ON COLUMN public.notification_templates.variables IS 'JSON array of variable names used in template (e.g., ["patient_name", "report_url"])';
COMMENT ON COLUMN public.notification_templates.is_system IS 'System templates cannot be deleted, only deactivated';

-- ============================================================
-- SECTION 2: REASSESSMENT RULES
-- ============================================================

-- Table for automatic re-assessment scheduling rules
CREATE TABLE IF NOT EXISTS public.reassessment_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL UNIQUE,
  description text,
  funnel_id uuid REFERENCES public.funnels_catalog(id),
  trigger_condition jsonb NOT NULL,
  schedule_interval_days integer CHECK (schedule_interval_days > 0),
  schedule_cron text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT schedule_check CHECK (
    (schedule_interval_days IS NOT NULL AND schedule_cron IS NULL) OR
    (schedule_interval_days IS NULL AND schedule_cron IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reassessment_rules_funnel ON public.reassessment_rules(funnel_id);
CREATE INDEX IF NOT EXISTS idx_reassessment_rules_active ON public.reassessment_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_reassessment_rules_priority ON public.reassessment_rules(priority);

-- Comments
COMMENT ON TABLE public.reassessment_rules IS 'V05-I09.4: Rules for scheduling patient re-assessments based on conditions';
COMMENT ON COLUMN public.reassessment_rules.trigger_condition IS 'JSONB object defining when rule triggers (e.g., {"risk_level": "high", "days_since_last": 30})';
COMMENT ON COLUMN public.reassessment_rules.schedule_interval_days IS 'Simple interval in days (mutually exclusive with schedule_cron)';
COMMENT ON COLUMN public.reassessment_rules.schedule_cron IS 'Cron expression for complex scheduling (mutually exclusive with schedule_interval_days)';

-- ============================================================
-- SECTION 3: KPI THRESHOLDS
-- ============================================================

-- Table for KPI thresholds and alert configurations
CREATE TABLE IF NOT EXISTS public.kpi_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  metric_type text NOT NULL CHECK (metric_type IN ('percentage', 'count', 'duration', 'score')),
  warning_threshold numeric,
  critical_threshold numeric,
  target_threshold numeric,
  unit text,
  evaluation_period_days integer,
  is_active boolean DEFAULT true NOT NULL,
  notify_on_breach boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kpi_thresholds_key ON public.kpi_thresholds(kpi_key);
CREATE INDEX IF NOT EXISTS idx_kpi_thresholds_active ON public.kpi_thresholds(is_active);
CREATE INDEX IF NOT EXISTS idx_kpi_thresholds_metric_type ON public.kpi_thresholds(metric_type);

-- Comments
COMMENT ON TABLE public.kpi_thresholds IS 'V05-I09.4: Key Performance Indicator thresholds for monitoring and alerting';
COMMENT ON COLUMN public.kpi_thresholds.kpi_key IS 'Unique identifier for KPI (e.g., "assessment_completion_rate", "avg_response_time")';
COMMENT ON COLUMN public.kpi_thresholds.warning_threshold IS 'Threshold that triggers warning alerts';
COMMENT ON COLUMN public.kpi_thresholds.critical_threshold IS 'Threshold that triggers critical alerts';
COMMENT ON COLUMN public.kpi_thresholds.target_threshold IS 'Desired target value for the KPI';
COMMENT ON COLUMN public.kpi_thresholds.evaluation_period_days IS 'Number of days over which to evaluate the KPI (NULL = real-time)';

-- ============================================================
-- SECTION 4: AUDIT TRAIL
-- ============================================================

-- Unified audit table for all operational settings changes
CREATE TABLE IF NOT EXISTS public.operational_settings_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values jsonb,
  new_values jsonb,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now() NOT NULL,
  change_reason text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_operational_audit_table ON public.operational_settings_audit(table_name);
CREATE INDEX IF NOT EXISTS idx_operational_audit_record ON public.operational_settings_audit(record_id);
CREATE INDEX IF NOT EXISTS idx_operational_audit_changed_by ON public.operational_settings_audit(changed_by);
CREATE INDEX IF NOT EXISTS idx_operational_audit_changed_at ON public.operational_settings_audit(changed_at DESC);

-- Comments
COMMENT ON TABLE public.operational_settings_audit IS 'V05-I09.4: Audit trail for all operational settings changes';
COMMENT ON COLUMN public.operational_settings_audit.table_name IS 'Name of the table that was modified';
COMMENT ON COLUMN public.operational_settings_audit.old_values IS 'JSONB snapshot of values before change';
COMMENT ON COLUMN public.operational_settings_audit.new_values IS 'JSONB snapshot of values after change';

-- ============================================================
-- SECTION 5: TRIGGERS FOR AUTOMATIC AUDIT LOGGING
-- ============================================================

-- Function to log changes to notification_templates
CREATE OR REPLACE FUNCTION public.audit_notification_templates()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, old_values, changed_by
    ) VALUES (
      'notification_templates',
      OLD.id,
      TG_OP,
      to_jsonb(OLD),
      OLD.updated_by
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, old_values, new_values, changed_by
    ) VALUES (
      'notification_templates',
      NEW.id,
      TG_OP,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.updated_by
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, new_values, changed_by
    ) VALUES (
      'notification_templates',
      NEW.id,
      TG_OP,
      to_jsonb(NEW),
      NEW.created_by
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_notification_templates_trigger ON public.notification_templates;
CREATE TRIGGER audit_notification_templates_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.audit_notification_templates();

-- Function to log changes to reassessment_rules
CREATE OR REPLACE FUNCTION public.audit_reassessment_rules()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, old_values, changed_by
    ) VALUES (
      'reassessment_rules',
      OLD.id,
      TG_OP,
      to_jsonb(OLD),
      OLD.updated_by
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, old_values, new_values, changed_by
    ) VALUES (
      'reassessment_rules',
      NEW.id,
      TG_OP,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.updated_by
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, new_values, changed_by
    ) VALUES (
      'reassessment_rules',
      NEW.id,
      TG_OP,
      to_jsonb(NEW),
      NEW.created_by
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_reassessment_rules_trigger ON public.reassessment_rules;
CREATE TRIGGER audit_reassessment_rules_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reassessment_rules
  FOR EACH ROW EXECUTE FUNCTION public.audit_reassessment_rules();

-- Function to log changes to kpi_thresholds
CREATE OR REPLACE FUNCTION public.audit_kpi_thresholds()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, old_values, changed_by
    ) VALUES (
      'kpi_thresholds',
      OLD.id,
      TG_OP,
      to_jsonb(OLD),
      OLD.updated_by
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, old_values, new_values, changed_by
    ) VALUES (
      'kpi_thresholds',
      NEW.id,
      TG_OP,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.updated_by
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.operational_settings_audit (
      table_name, record_id, operation, new_values, changed_by
    ) VALUES (
      'kpi_thresholds',
      NEW.id,
      TG_OP,
      to_jsonb(NEW),
      NEW.created_by
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_kpi_thresholds_trigger ON public.kpi_thresholds;
CREATE TRIGGER audit_kpi_thresholds_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.kpi_thresholds
  FOR EACH ROW EXECUTE FUNCTION public.audit_kpi_thresholds();

-- ============================================================
-- SECTION 6: UPDATE TIMESTAMP TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_operational_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notification_templates_timestamp ON public.notification_templates;
CREATE TRIGGER update_notification_templates_timestamp
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_operational_settings_timestamp();

DROP TRIGGER IF EXISTS update_reassessment_rules_timestamp ON public.reassessment_rules;
CREATE TRIGGER update_reassessment_rules_timestamp
  BEFORE UPDATE ON public.reassessment_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_operational_settings_timestamp();

DROP TRIGGER IF EXISTS update_kpi_thresholds_timestamp ON public.kpi_thresholds;
CREATE TRIGGER update_kpi_thresholds_timestamp
  BEFORE UPDATE ON public.kpi_thresholds
  FOR EACH ROW EXECUTE FUNCTION public.update_operational_settings_timestamp();

-- ============================================================
-- SECTION 7: ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reassessment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_settings_audit ENABLE ROW LEVEL SECURITY;

-- Policies for notification_templates
DROP POLICY IF EXISTS notification_templates_select_authenticated ON public.notification_templates;
CREATE POLICY notification_templates_select_authenticated
  ON public.notification_templates
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS notification_templates_admin_modify ON public.notification_templates;
CREATE POLICY notification_templates_admin_modify
  ON public.notification_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_app_meta_data->>'role' IN ('admin', 'clinician'))
    )
  );

-- Policies for reassessment_rules
DROP POLICY IF EXISTS reassessment_rules_select_authenticated ON public.reassessment_rules;
CREATE POLICY reassessment_rules_select_authenticated
  ON public.reassessment_rules
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS reassessment_rules_admin_modify ON public.reassessment_rules;
CREATE POLICY reassessment_rules_admin_modify
  ON public.reassessment_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_app_meta_data->>'role' IN ('admin', 'clinician'))
    )
  );

-- Policies for kpi_thresholds
DROP POLICY IF EXISTS kpi_thresholds_select_authenticated ON public.kpi_thresholds;
CREATE POLICY kpi_thresholds_select_authenticated
  ON public.kpi_thresholds
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS kpi_thresholds_admin_modify ON public.kpi_thresholds;
CREATE POLICY kpi_thresholds_admin_modify
  ON public.kpi_thresholds
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_app_meta_data->>'role' IN ('admin', 'clinician'))
    )
  );

-- Policies for operational_settings_audit
DROP POLICY IF EXISTS operational_audit_select_admin ON public.operational_settings_audit;
CREATE POLICY operational_audit_select_admin
  ON public.operational_settings_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_app_meta_data->>'role' IN ('admin', 'clinician'))
    )
  );

-- ============================================================
-- SECTION 8: SEED DATA
-- ============================================================

-- Default notification templates
INSERT INTO public.notification_templates (
  template_key,
  name,
  description,
  channel,
  subject_template,
  body_template,
  variables,
  is_system
) VALUES
(
  'report_ready',
  'Bericht bereit',
  'Benachrichtigung wenn ein Assessment-Bericht fertig ist',
  'in_app',
  'Ihr Stress-Assessment-Bericht ist fertig',
  'Hallo {{patient_name}},\n\nIhr Stress-Assessment-Bericht ist jetzt verfügbar. Sie können ihn unter folgendem Link einsehen:\n\n{{report_url}}\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.',
  '["patient_name", "report_url"]'::jsonb,
  true
),
(
  'followup_reminder',
  'Follow-up Erinnerung',
  'Erinnerung für geplante Nachuntersuchung',
  'in_app',
  'Erinnerung: Geplante Nachuntersuchung',
  'Hallo {{patient_name}},\n\nDies ist eine Erinnerung an Ihre geplante Nachuntersuchung am {{followup_date}}.\n\nBitte nehmen Sie sich Zeit für das Assessment.',
  '["patient_name", "followup_date"]'::jsonb,
  true
),
(
  'high_risk_alert',
  'Hochrisiko-Warnung',
  'Warnung bei hohem Stresslevel',
  'in_app',
  'Wichtig: Erhöhtes Stresslevel festgestellt',
  'Hallo {{patient_name}},\n\nIhr aktuelles Assessment zeigt ein erhöhtes Stresslevel. Wir empfehlen, zeitnah Kontakt mit Ihrem Behandlungsteam aufzunehmen.\n\nNotfallkontakt: {{emergency_contact}}',
  '["patient_name", "emergency_contact"]'::jsonb,
  true
)
ON CONFLICT (template_key) DO NOTHING;

-- Default reassessment rules
INSERT INTO public.reassessment_rules (
  rule_name,
  description,
  trigger_condition,
  schedule_interval_days,
  priority
) VALUES
(
  'high_risk_weekly_followup',
  'Wöchentliche Nachuntersuchung bei hohem Risiko',
  '{"risk_level": "high"}'::jsonb,
  7,
  'high'
),
(
  'medium_risk_biweekly_followup',
  'Zweiwöchentliche Nachuntersuchung bei mittlerem Risiko',
  '{"risk_level": "medium"}'::jsonb,
  14,
  'medium'
),
(
  'low_risk_monthly_followup',
  'Monatliche Nachuntersuchung bei niedrigem Risiko',
  '{"risk_level": "low"}'::jsonb,
  30,
  'low'
),
(
  'post_assessment_30day_check',
  'Standard 30-Tage Check nach jedem Assessment',
  '{"assessment_completed": true}'::jsonb,
  30,
  'medium'
)
ON CONFLICT (rule_name) DO NOTHING;

-- Default KPI thresholds
INSERT INTO public.kpi_thresholds (
  kpi_key,
  name,
  description,
  metric_type,
  warning_threshold,
  critical_threshold,
  target_threshold,
  unit,
  evaluation_period_days
) VALUES
(
  'assessment_completion_rate',
  'Assessment-Abschlussquote',
  'Prozentsatz der gestarteten Assessments, die auch abgeschlossen wurden',
  'percentage',
  70.0,
  50.0,
  85.0,
  '%',
  30
),
(
  'avg_response_time_hours',
  'Durchschnittliche Antwortzeit',
  'Durchschnittliche Zeit bis zur Bearbeitung von Support-Anfragen',
  'duration',
  48.0,
  72.0,
  24.0,
  'Stunden',
  7
),
(
  'high_risk_patient_count',
  'Anzahl Hochrisiko-Patienten',
  'Anzahl der Patienten mit hohem Stresslevel',
  'count',
  10.0,
  20.0,
  5.0,
  'Patienten',
  NULL
),
(
  'report_generation_success_rate',
  'Bericht-Generierungsrate',
  'Prozentsatz erfolgreicher Berichtgenerierungen',
  'percentage',
  95.0,
  90.0,
  99.0,
  '%',
  7
),
(
  'avg_stress_score',
  'Durchschnittlicher Stress-Score',
  'Durchschnittlicher Stress-Score aller aktiven Patienten',
  'score',
  65.0,
  75.0,
  50.0,
  'Punkte',
  14
)
ON CONFLICT (kpi_key) DO NOTHING;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
