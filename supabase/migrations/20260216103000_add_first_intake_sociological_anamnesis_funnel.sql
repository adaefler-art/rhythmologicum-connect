-- Migration: Add first-intake sociological anamnesis funnel
-- Purpose: Seed a new patient-facing first-intake assessment funnel using V0.5 catalog/version mechanics

DO $$
DECLARE
  v_funnel_id UUID;
  v_version_id UUID;
BEGIN
  INSERT INTO public.funnels_catalog (
    slug,
    title,
    pillar_id,
    description,
    is_active,
    est_duration_min,
    outcomes,
    published
  )
  VALUES (
    'first-intake-sociological-anamnesis',
    'Erstaufnahme: Soziologische Anamnese',
    'social',
    'Erfassung der sozialen Lebenssituation für eine strukturierte Erstaufnahme.',
    true,
    12,
    '["Soziale Belastungsfaktoren erfassen", "Unterstützungsnetz verstehen", "Versorgungsplanung vorbereiten"]'::jsonb,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    pillar_id = EXCLUDED.pillar_id,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    est_duration_min = EXCLUDED.est_duration_min,
    outcomes = EXCLUDED.outcomes,
    published = EXCLUDED.published
  RETURNING id INTO v_funnel_id;

  INSERT INTO public.funnel_versions (
    funnel_id,
    version,
    is_default,
    rollout_percent,
    algorithm_bundle_version,
    prompt_version,
    questionnaire_config,
    content_manifest,
    status,
    published_at
  )
  VALUES (
    v_funnel_id,
    '1.0.0',
    true,
    100,
    'v1.0.0',
    '1.0',
    jsonb_build_object(
      'schema_version', 'v1',
      'version', '1.0',
      'steps', jsonb_build_array(
        jsonb_build_object(
          'id', 'step-1',
          'title', 'Wohn- und Lebenssituation',
          'description', 'Grundlegende soziale Rahmenbedingungen Ihrer aktuellen Situation',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q1-household-size',
              'key', 'household_size',
              'type', 'number',
              'label', 'Wie viele Personen leben in Ihrem Haushalt (inkl. Ihnen)?',
              'helpText', 'Bitte geben Sie die aktuelle Haushaltsgröße an.',
              'required', true,
              'minValue', 1,
              'maxValue', 12
            ),
            jsonb_build_object(
              'id', 'q2-living-situation',
              'key', 'living_situation',
              'type', 'radio',
              'label', 'Wie wohnen Sie derzeit?',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'alone', 'label', 'Allein'),
                jsonb_build_object('value', 'partner', 'label', 'Mit Partner:in'),
                jsonb_build_object('value', 'family', 'label', 'Mit Familie/Kinder'),
                jsonb_build_object('value', 'shared', 'label', 'Wohngemeinschaft'),
                jsonb_build_object('value', 'other', 'label', 'Andere Situation')
              )
            ),
            jsonb_build_object(
              'id', 'q3-care-responsibilities',
              'key', 'care_responsibilities',
              'type', 'radio',
              'label', 'Übernehmen Sie regelmäßig Pflege- oder Betreuungsaufgaben?',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'yes', 'label', 'Ja'),
                jsonb_build_object('value', 'no', 'label', 'Nein')
              )
            ),
            jsonb_build_object(
              'id', 'q4-housing-stability',
              'key', 'housing_stability',
              'type', 'scale',
              'label', 'Wie stabil schätzen Sie Ihre aktuelle Wohnsituation ein?',
              'helpText', '1 = sehr instabil, 5 = sehr stabil',
              'required', true,
              'minValue', 1,
              'maxValue', 5
            )
          )
        ),
        jsonb_build_object(
          'id', 'step-2',
          'title', 'Soziales Umfeld und Unterstützung',
          'description', 'Ihr soziales Netzwerk und verfügbare Unterstützung',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q5-social-support',
              'key', 'social_support_level',
              'type', 'scale',
              'label', 'Wie stark fühlen Sie sich sozial unterstützt?',
              'helpText', '1 = gar nicht, 5 = sehr stark',
              'required', true,
              'minValue', 1,
              'maxValue', 5
            ),
            jsonb_build_object(
              'id', 'q6-contact-frequency',
              'key', 'contact_frequency',
              'type', 'radio',
              'label', 'Wie häufig haben Sie persönlichen Kontakt zu nahestehenden Personen?',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'daily', 'label', 'Täglich'),
                jsonb_build_object('value', 'weekly', 'label', 'Mehrmals pro Woche'),
                jsonb_build_object('value', 'monthly', 'label', 'Mehrmals pro Monat'),
                jsonb_build_object('value', 'rarely', 'label', 'Selten')
              )
            ),
            jsonb_build_object(
              'id', 'q7-loneliness',
              'key', 'loneliness_level',
              'type', 'scale',
              'label', 'Wie häufig fühlen Sie sich einsam?',
              'helpText', '1 = nie, 5 = sehr häufig',
              'required', true,
              'minValue', 1,
              'maxValue', 5
            ),
            jsonb_build_object(
              'id', 'q8-support-sources',
              'key', 'support_sources',
              'type', 'checkbox',
              'label', 'Von wem erhalten Sie aktuell Unterstützung? (Mehrfachauswahl möglich)',
              'required', false,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'family', 'label', 'Familie'),
                jsonb_build_object('value', 'friends', 'label', 'Freunde'),
                jsonb_build_object('value', 'neighbors', 'label', 'Nachbarschaft'),
                jsonb_build_object('value', 'professional', 'label', 'Professionelle Unterstützung'),
                jsonb_build_object('value', 'none', 'label', 'Aktuell keine Unterstützung')
              )
            )
          )
        ),
        jsonb_build_object(
          'id', 'step-3',
          'title', 'Arbeit, Alltag und Belastung',
          'description', 'Berufliche und alltagsbezogene Faktoren',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q9-employment-status',
              'key', 'employment_status',
              'type', 'radio',
              'label', 'Welche Aussage trifft auf Ihre aktuelle berufliche Situation am besten zu?',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'full_time', 'label', 'Vollzeit beschäftigt'),
                jsonb_build_object('value', 'part_time', 'label', 'Teilzeit beschäftigt'),
                jsonb_build_object('value', 'self_employed', 'label', 'Selbstständig'),
                jsonb_build_object('value', 'unemployed', 'label', 'Derzeit nicht beschäftigt'),
                jsonb_build_object('value', 'retired', 'label', 'Rente/Pension'),
                jsonb_build_object('value', 'other', 'label', 'Andere Situation')
              )
            ),
            jsonb_build_object(
              'id', 'q10-financial-stress',
              'key', 'financial_stress_level',
              'type', 'scale',
              'label', 'Wie stark erleben Sie aktuell finanzielle Belastung?',
              'helpText', '1 = keine Belastung, 5 = sehr starke Belastung',
              'required', true,
              'minValue', 1,
              'maxValue', 5
            ),
            jsonb_build_object(
              'id', 'q11-language-barriers',
              'key', 'language_barriers',
              'type', 'radio',
              'label', 'Gibt es sprachliche Hürden im Kontakt mit Gesundheitsangeboten?',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'yes', 'label', 'Ja'),
                jsonb_build_object('value', 'no', 'label', 'Nein')
              )
            ),
            jsonb_build_object(
              'id', 'q12-primary-concern',
              'key', 'primary_sociological_concern',
              'type', 'textarea',
              'label', 'Gibt es aktuell eine soziale Belastung, die Sie besonders beschäftigt?',
              'helpText', 'Beschreiben Sie kurz die wichtigste Belastung in Ihrem Alltag.',
              'required', true
            )
          )
        )
      )
    ),
    jsonb_build_object(
      'version', '1.0',
      'pages', jsonb_build_array(
        jsonb_build_object(
          'slug', 'intro',
          'title', 'Willkommen zur Erstaufnahme',
          'sections', jsonb_build_array(
            jsonb_build_object(
              'key', 'hero',
              'type', 'hero',
              'content', jsonb_build_object(
                'title', 'Soziologische Anamnese',
                'subtitle', 'Gemeinsam die soziale Ausgangssituation verstehen'
              )
            ),
            jsonb_build_object(
              'key', 'intro-text',
              'type', 'text',
              'content', jsonb_build_object(
                'text', 'Dieses Erstaufnahme-Assessment hilft uns, Ihre soziale Situation besser einzuordnen und passende nächste Schritte vorzubereiten.'
              )
            )
          )
        )
      )
    ),
    'published',
    now()
  )
  ON CONFLICT (funnel_id, version) DO UPDATE SET
    is_default = EXCLUDED.is_default,
    rollout_percent = EXCLUDED.rollout_percent,
    algorithm_bundle_version = EXCLUDED.algorithm_bundle_version,
    prompt_version = EXCLUDED.prompt_version,
    questionnaire_config = EXCLUDED.questionnaire_config,
    content_manifest = EXCLUDED.content_manifest,
    status = EXCLUDED.status,
    published_at = EXCLUDED.published_at
  RETURNING id INTO v_version_id;

  UPDATE public.funnels_catalog
  SET default_version_id = v_version_id
  WHERE id = v_funnel_id;
END $$;
