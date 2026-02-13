DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'clinical_reasoning_config_status'
  ) THEN
    CREATE TYPE public.clinical_reasoning_config_status AS ENUM ('draft', 'active', 'archived');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.clinical_reasoning_configs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  version int NOT NULL,
  status public.clinical_reasoning_config_status NOT NULL DEFAULT 'draft',
  config_json jsonb NOT NULL,
  change_reason text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT clinical_reasoning_configs_pkey PRIMARY KEY (id),
  CONSTRAINT clinical_reasoning_configs_version_unique UNIQUE (version),
  CONSTRAINT clinical_reasoning_configs_version_positive CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS clinical_reasoning_configs_single_active
  ON public.clinical_reasoning_configs((status))
  WHERE status = 'active';

ALTER TABLE public.clinical_reasoning_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinical_reasoning_configs_select_admin ON public.clinical_reasoning_configs;
CREATE POLICY clinical_reasoning_configs_select_admin
  ON public.clinical_reasoning_configs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_app_meta_data->>'role' IN ('admin', 'clinician'))
    )
  );

DROP POLICY IF EXISTS clinical_reasoning_configs_modify_admin ON public.clinical_reasoning_configs;
CREATE POLICY clinical_reasoning_configs_modify_admin
  ON public.clinical_reasoning_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_app_meta_data->>'role' IN ('admin', 'clinician'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_app_meta_data->>'role' IN ('admin', 'clinician'))
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.clinical_reasoning_configs TO authenticated;
GRANT ALL ON public.clinical_reasoning_configs TO service_role;

WITH seed AS (
  SELECT jsonb_build_object(
    'differential_templates', jsonb_build_array(
      jsonb_build_object(
        'label', 'Panic-like autonomic episode',
        'trigger_terms', jsonb_build_array('herzrasen', 'panik', 'angst', 'schwindel'),
        'required_terms', jsonb_build_array('herzrasen'),
        'exclusions', jsonb_build_array('brustschmerz seit 30 minuten'),
        'base_likelihood', 'medium'
      ),
      jsonb_build_object(
        'label', 'Non-specific stress reactivity',
        'trigger_terms', jsonb_build_array('stress', 'ueberfordert', 'erschopft', 'angespannt'),
        'base_likelihood', 'low'
      )
    ),
    'risk_weighting', jsonb_build_object(
      'red_flag_weight', 3,
      'chronicity_weight', 2,
      'anxiety_modifier', 1
    ),
    'open_question_templates', jsonb_build_array(
      jsonb_build_object(
        'condition_label', 'Panic-like autonomic episode',
        'questions', jsonb_build_array(
          jsonb_build_object('text', 'Wann treten die Episoden auf und wie lange dauern sie?', 'priority', 1),
          jsonb_build_object('text', 'Gibt es ausloesende Situationen oder Belastungen?', 'priority', 2)
        )
      ),
      jsonb_build_object(
        'condition_label', 'Non-specific stress reactivity',
        'questions', jsonb_build_array(
          jsonb_build_object('text', 'Welche alltaeglichen Faktoren verschlechtern die Beschwerden?', 'priority', 2)
        )
      )
    )
  ) AS config_json
)
INSERT INTO public.clinical_reasoning_configs (
  version,
  status,
  config_json,
  change_reason,
  created_by
)
SELECT
  1,
  'active',
  seed.config_json,
  'initial seed',
  'system'
FROM seed
WHERE NOT EXISTS (
  SELECT 1 FROM public.clinical_reasoning_configs WHERE status = 'active'
);
