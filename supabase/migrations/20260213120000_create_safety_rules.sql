-- Safety rules management tables (versioned)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'safety_rule_version_status'
  ) THEN
    CREATE TYPE public.safety_rule_version_status AS ENUM ('draft', 'active', 'archived');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.safety_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT safety_rules_pkey PRIMARY KEY (id),
  CONSTRAINT safety_rules_key_unique UNIQUE (key)
);

CREATE TABLE IF NOT EXISTS public.safety_rule_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  rule_id uuid NOT NULL REFERENCES public.safety_rules(id) ON DELETE CASCADE,
  version int NOT NULL,
  status public.safety_rule_version_status NOT NULL DEFAULT 'draft',
  logic_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  defaults jsonb NOT NULL DEFAULT '{}'::jsonb,
  change_reason text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT safety_rule_versions_pkey PRIMARY KEY (id),
  CONSTRAINT safety_rule_versions_rule_version_unique UNIQUE (rule_id, version),
  CONSTRAINT safety_rule_versions_version_check CHECK (version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS safety_rule_versions_active_unique
  ON public.safety_rule_versions(rule_id)
  WHERE status = 'active';

ALTER TABLE public.safety_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_rule_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS safety_rules_select_admin ON public.safety_rules;
CREATE POLICY safety_rules_select_admin
  ON public.safety_rules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_app_meta_data->>'role' IN ('admin', 'clinician'))
    )
  );

DROP POLICY IF EXISTS safety_rules_modify_admin ON public.safety_rules;
CREATE POLICY safety_rules_modify_admin
  ON public.safety_rules
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

DROP POLICY IF EXISTS safety_rule_versions_select_admin ON public.safety_rule_versions;
CREATE POLICY safety_rule_versions_select_admin
  ON public.safety_rule_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_app_meta_data->>'role' IN ('admin', 'clinician'))
    )
  );

DROP POLICY IF EXISTS safety_rule_versions_modify_admin ON public.safety_rule_versions;
CREATE POLICY safety_rule_versions_modify_admin
  ON public.safety_rule_versions
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

INSERT INTO public.safety_rules (key, title)
VALUES
  ('SFTY-2.1-R-CHEST-PAIN', 'Brustschmerz'),
  ('SFTY-2.1-R-SYNCOPE', 'Synkope / Bewusstseinsverlust'),
  ('SFTY-2.1-R-SEVERE-DYSPNEA', 'Schwere Atemnot'),
  ('SFTY-2.1-R-SUICIDAL-IDEATION', 'Suizidale Gedanken'),
  ('SFTY-2.1-R-ACUTE-PSYCH', 'Akute psychische Krise'),
  ('SFTY-2.1-R-SEVERE-PALPITATIONS', 'Starkes Herzrasen'),
  ('SFTY-2.1-R-ACUTE-NEURO', 'Akute neurologische Ausfaelle'),
  ('SFTY-2.1-R-SEVERE-UNCONTROLLED', 'Schwere unkontrollierbare Symptome')
ON CONFLICT (key) DO NOTHING;

WITH rule_seeds AS (
  SELECT
    id AS rule_id,
    key,
    CASE key
      WHEN 'SFTY-2.1-R-CHEST-PAIN' THEN
        '{"patterns":["brustschmerz","brustschmerzen","herzschmerz","herzschmerzen","schmerz in der brust","schmerzen in der brust","brust druck","brustdruck","herzenge","angina pectoris","stechen in der brust","brennen in der brust","engegefuehl brust","chest pain","chest discomfort","chest pressure","heart pain","angina","tightness in chest","crushing chest","squeezing chest"],"qualifiers":{"requires_any_of":[{"id":"acute","patterns":["akut"]},{"id":"sudden","patterns":["ploetzlich"]},{"id":"new","patterns":["neu"]},{"id":"exertion","patterns":["belastung"]},{"id":"exertion_alt","patterns":["anstrengung"]},{"id":"exertion_stairs","patterns":["treppe"]},{"id":"dyspnea","patterns":["atemnot"]},{"id":"dyspnea_alt","patterns":["luftnot"]},{"id":"syncope","patterns":["ohnmacht"]},{"id":"syncope_alt","patterns":["synkope"]},{"id":"radiation_arm","patterns":["ausstrahl","arm"]},{"id":"radiation_jaw","patterns":["ausstrahl","kiefer"]},{"id":"radiation_back","patterns":["ausstrahl","rucken"]},{"id":"rest_pain","patterns":["in ruhe"]}]},"exclusions":["kein brustschmerz","keine brustschmerzen","no chest pain"],"exclusion_mode":"always"}'::jsonb
      WHEN 'SFTY-2.1-R-SEVERE-PALPITATIONS' THEN
        '{"patterns":["herzrasen","herzklopfen","herzrasen extrem","herz rast unkontrolliert","herzrhythmusstoerung","herzrhythmusstorung","arrhythmie","herzstolpern stark","starkes herzstolpern","puls ueber 150","puls uber 150","puls sehr schnell","herzjagen","heart racing uncontrollably","severe palpitations","arrhythmia","irregular heartbeat severe","heart rate over 150","tachycardia severe"],"qualifiers":{"requires_any_of":[{"id":"syncope","patterns":["synkope"]},{"id":"syncope_alt","patterns":["ohnmacht"]},{"id":"syncope_alt2","patterns":["umgekippt"]},{"id":"chest_pain","patterns":["brustschmerz"]},{"id":"dyspnea","patterns":["atemnot"]},{"id":"dyspnea_alt","patterns":["luftnot"]},{"id":"persistent","patterns":["anhaltend","stark"]},{"id":"persistent_alt","patterns":["dauerhaft","stark"]}]},"exclusions":["panik","angst","nervos","stress","aufgeregt"],"exclusion_mode":"only_if_unqualified"}'::jsonb
      WHEN 'SFTY-2.1-R-SUICIDAL-IDEATION' THEN
        '{"patterns":["suizid","selbstmord","umbringen","sterben will","nicht mehr leben","selbstverletzung","verletze mich","selbstschaedigung","leben beenden","suizidgedanken","todesgedanken","suicide","kill myself","end my life","self-harm","self harm","hurt myself","suicidal","want to die","better off dead"],"a_level_requires_any_of":[{"id":"intent","patterns":["ich will","umbringen"]},{"id":"intent_alt","patterns":["ich will","sterben"]},{"id":"intent_alt2","patterns":["ich bringe","um"]},{"id":"intent_alt3","patterns":["ich werde","umbringen"]},{"id":"plan","patterns":["plan","suizid"]},{"id":"prep","patterns":["vorbereitung","suizid"]},{"id":"means","patterns":["habe","tabletten"]},{"id":"means_alt","patterns":["habe","pillen"]},{"id":"means_alt2","patterns":["habe","messer"]}],"requires_verified_evidence":true}'::jsonb
      WHEN 'SFTY-2.1-R-SEVERE-DYSPNEA' THEN
        '{"patterns":["atemnot","keine luft","nicht atmen","erstick","luftnot","schwer zu atmen","kann nicht atmen","bekomme keine luft","kurzatmig","dyspnoe","cant breathe","cannot breathe","shortness of breath","difficulty breathing","gasping for air","suffocating","dyspnea","severe breathlessness"],"requires_verified_evidence":true}'::jsonb
      WHEN 'SFTY-2.1-R-SYNCOPE' THEN
        '{"patterns":["ohnmacht","ohnmaechtig","bewusstlos","bewusstlosigkeit","umgekippt","kollabiert","zusammengebrochen","black out","schwarz vor augen","bewusstsein verloren","synkope","syncope","fainted","passed out","lost consciousness","blacked out","collapsed","blackout"]}'::jsonb
      WHEN 'SFTY-2.1-R-ACUTE-PSYCH' THEN
        '{"patterns":["panikattacke","akute panik","totale panik","nervenzusammenbruch","psychose","halluzinationen","stimmen hoeren","hoere stimmen","wahnvorstellungen","akute krise","psychiatrischer notfall","panic attack","severe panic","psychotic","hallucinations","hearing voices","delusions","nervous breakdown","psychiatric emergency","mental breakdown"]}'::jsonb
      WHEN 'SFTY-2.1-R-ACUTE-NEURO' THEN
        '{"patterns":["schlaganfall","laehmung","lahmung","gesichtslaehmung","gesichtslahmung","ploetzliche laehmung","plotzliche lahmung","sprachstoerung ploetzlich","sprachstorung plotzlich","sehstoerung ploetzlich","sehstorung plotzlich","kribbeln halbseitig","halbseitiges kribbeln","taubheit halbseitig","halbseitige taubheit","kann nicht sprechen","kann ploetzlich nicht sprechen","kann plotzlich nicht sprechen","koordinationsverlust","stroke","paralysis","facial droop","sudden speech difficulty","sudden vision loss","one-sided numbness","one-sided weakness","cannot speak suddenly","loss of coordination"],"requires_verified_evidence":true}'::jsonb
      WHEN 'SFTY-2.1-R-SEVERE-UNCONTROLLED' THEN
        '{"patterns":["notfall","akute gefahr","unertraeglich","unertraglich","unkontrollierbar","sofort hilfe","dringend hilfe","notaufnahme","krankenwagen","rettungsdienst","112","emergency","acute danger","unbearable","uncontrollable"],"requires_verified_evidence":true}'::jsonb
      ELSE '{}'::jsonb
    END AS logic_json,
    CASE key
      WHEN 'SFTY-2.1-R-CHEST-PAIN' THEN '{"level_default":"B"}'::jsonb
      WHEN 'SFTY-2.1-R-SYNCOPE' THEN '{"level_default":"B"}'::jsonb
      WHEN 'SFTY-2.1-R-SEVERE-DYSPNEA' THEN '{"level_default":"A"}'::jsonb
      WHEN 'SFTY-2.1-R-SUICIDAL-IDEATION' THEN '{"level_default":"A"}'::jsonb
      WHEN 'SFTY-2.1-R-ACUTE-PSYCH' THEN '{"level_default":"B"}'::jsonb
      WHEN 'SFTY-2.1-R-SEVERE-PALPITATIONS' THEN '{"level_default":"B"}'::jsonb
      WHEN 'SFTY-2.1-R-ACUTE-NEURO' THEN '{"level_default":"A"}'::jsonb
      WHEN 'SFTY-2.1-R-SEVERE-UNCONTROLLED' THEN '{"level_default":"A"}'::jsonb
      ELSE '{}'::jsonb
    END AS defaults
  FROM public.safety_rules
)
INSERT INTO public.safety_rule_versions (
  rule_id,
  version,
  status,
  logic_json,
  defaults,
  change_reason,
  created_by
)
SELECT
  rule_id,
  1,
  'active',
  logic_json,
  defaults,
  'initial seed',
  'system'
FROM rule_seeds
ON CONFLICT (rule_id, version) DO NOTHING;
