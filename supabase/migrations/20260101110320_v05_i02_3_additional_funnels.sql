-- Migration: V05-I02.3 - Add Additional Funnels to Catalog
-- Created: 2026-01-01
-- Author: GitHub Copilot
--
-- Purpose: Add 2-3 additional funnels to the catalog with stub manifests
--
-- Funnels added:
-- 1. cardiovascular-age (Prevention pillar)
-- 2. sleep-quality (Sleep pillar)
-- 3. heart-health-nutrition (Nutrition pillar)
--
-- Each funnel includes:
-- - funnels_catalog entry with pillar, description, duration, outcomes
-- - funnel_versions entry with questionnaire_config and content_manifest stubs
-- - algorithm_bundle_version and prompt_version set to v0.5.0

-- ============================================================
-- FUNNEL 1: Cardiovascular Age Assessment
-- ============================================================

DO $$
DECLARE
  v_funnel_id UUID;
  v_version_id UUID;
BEGIN
  -- Insert or update funnel in catalog
  INSERT INTO public.funnels_catalog (slug, title, pillar_id, description, is_active, est_duration_min, outcomes)
  VALUES (
    'cardiovascular-age',
    'Cardiovascular Age Assessment',
    'prevention',
    'Bestimmen Sie Ihr kardiovaskuläres Alter basierend auf Risikofaktoren und Lebensstil',
    true,
    8,
    '["CV-Alter ermitteln", "Risikofaktoren identifizieren", "Präventionsstrategien erhalten"]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    pillar_id = EXCLUDED.pillar_id,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    est_duration_min = EXCLUDED.est_duration_min,
    outcomes = EXCLUDED.outcomes
  RETURNING id INTO v_funnel_id;

  -- Insert funnel version with stub manifests
  INSERT INTO public.funnel_versions (
    funnel_id,
    version,
    is_default,
    rollout_percent,
    algorithm_bundle_version,
    prompt_version,
    questionnaire_config,
    content_manifest
  )
  VALUES (
    v_funnel_id,
    '1.0.0',
    true,
    100,
    'v0.5.0',
    '1.0',
    -- Questionnaire config stub
    jsonb_build_object(
      'version', '1.0',
      'steps', jsonb_build_array(
        jsonb_build_object(
          'id', 'step-1',
          'title', 'Grunddaten',
          'description', 'Ihre persönlichen Daten',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q1-age',
              'key', 'age',
              'type', 'number',
              'label', 'Wie alt sind Sie?',
              'required', true,
              'minValue', 18,
              'maxValue', 120
            ),
            jsonb_build_object(
              'id', 'q2-gender',
              'key', 'gender',
              'type', 'radio',
              'label', 'Geschlecht',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'male', 'label', 'Männlich'),
                jsonb_build_object('value', 'female', 'label', 'Weiblich'),
                jsonb_build_object('value', 'other', 'label', 'Divers')
              )
            )
          )
        ),
        jsonb_build_object(
          'id', 'step-2',
          'title', 'Gesundheitsfaktoren',
          'description', 'Aktuelle Gesundheitsindikatoren',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q3-blood-pressure',
              'key', 'blood_pressure',
              'type', 'radio',
              'label', 'Blutdruck-Status',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'normal', 'label', 'Normal (<120/80)'),
                jsonb_build_object('value', 'elevated', 'label', 'Erhöht (120-129/<80)'),
                jsonb_build_object('value', 'high', 'label', 'Hoch (≥130/80)')
              )
            ),
            jsonb_build_object(
              'id', 'q4-cholesterol',
              'key', 'cholesterol',
              'type', 'radio',
              'label', 'Cholesterin-Status',
              'required', false,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'normal', 'label', 'Normal'),
                jsonb_build_object('value', 'borderline', 'label', 'Grenzwertig'),
                jsonb_build_object('value', 'high', 'label', 'Erhöht')
              )
            )
          )
        ),
        jsonb_build_object(
          'id', 'step-3',
          'title', 'Lebensstil',
          'description', 'Ihre Lebensgewohnheiten',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q5-smoking',
              'key', 'smoking',
              'type', 'radio',
              'label', 'Rauchen Sie?',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'never', 'label', 'Nie geraucht'),
                jsonb_build_object('value', 'former', 'label', 'Ex-Raucher'),
                jsonb_build_object('value', 'current', 'label', 'Aktuell Raucher')
              )
            ),
            jsonb_build_object(
              'id', 'q6-exercise',
              'key', 'exercise',
              'type', 'scale',
              'label', 'Bewegung pro Woche (Tage)',
              'required', true,
              'minValue', 0,
              'maxValue', 7
            )
          )
        )
      )
    ),
    -- Content manifest stub
    jsonb_build_object(
      'version', '1.0',
      'pages', jsonb_build_array(
        jsonb_build_object(
          'slug', 'intro',
          'title', 'Willkommen',
          'description', 'Kardiovaskuläres Alter Assessment',
          'sections', jsonb_build_array(
            jsonb_build_object(
              'key', 'hero',
              'type', 'hero',
              'content', jsonb_build_object(
                'title', 'Bestimmen Sie Ihr kardiovaskuläres Alter',
                'subtitle', 'Ein wissenschaftlich validiertes Assessment'
              )
            ),
            jsonb_build_object(
              'key', 'intro-text',
              'type', 'text',
              'content', jsonb_build_object(
                'text', 'Dieses Assessment hilft Ihnen, Ihr kardiovaskuläres Alter zu bestimmen.'
              )
            )
          )
        ),
        jsonb_build_object(
          'slug', 'info-risk-factors',
          'title', 'Risikofaktoren',
          'sections', jsonb_build_array(
            jsonb_build_object(
              'key', 'risk-info',
              'type', 'markdown',
              'content', jsonb_build_object(
                'markdown', '## Kardiovaskuläre Risikofaktoren\n\nWichtige Faktoren für Ihre Herzgesundheit.'
              )
            )
          )
        )
      )
    )
  )
  ON CONFLICT (funnel_id, version) DO UPDATE SET
    is_default = EXCLUDED.is_default,
    rollout_percent = EXCLUDED.rollout_percent,
    algorithm_bundle_version = EXCLUDED.algorithm_bundle_version,
    prompt_version = EXCLUDED.prompt_version,
    questionnaire_config = EXCLUDED.questionnaire_config,
    content_manifest = EXCLUDED.content_manifest
  RETURNING id INTO v_version_id;

  -- Set default version reference
  UPDATE public.funnels_catalog
  SET default_version_id = v_version_id
  WHERE id = v_funnel_id;
END $$;

-- ============================================================
-- FUNNEL 2: Sleep Quality Assessment
-- ============================================================

DO $$
DECLARE
  v_funnel_id UUID;
  v_version_id UUID;
BEGIN
  -- Insert or update funnel in catalog
  INSERT INTO public.funnels_catalog (slug, title, pillar_id, description, is_active, est_duration_min, outcomes)
  VALUES (
    'sleep-quality',
    'Sleep Quality Assessment',
    'sleep',
    'Umfassende Bewertung Ihrer Schlafqualität und Schlafhygiene',
    true,
    10,
    '["Schlafqualität bewerten", "Schlafstörungen erkennen", "Verbesserungstipps erhalten"]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    pillar_id = EXCLUDED.pillar_id,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    est_duration_min = EXCLUDED.est_duration_min,
    outcomes = EXCLUDED.outcomes
  RETURNING id INTO v_funnel_id;

  -- Insert funnel version with stub manifests
  INSERT INTO public.funnel_versions (
    funnel_id,
    version,
    is_default,
    rollout_percent,
    algorithm_bundle_version,
    prompt_version,
    questionnaire_config,
    content_manifest
  )
  VALUES (
    v_funnel_id,
    '1.0.0',
    true,
    100,
    'v0.5.0',
    '1.0',
    -- Questionnaire config stub
    jsonb_build_object(
      'version', '1.0',
      'steps', jsonb_build_array(
        jsonb_build_object(
          'id', 'step-1',
          'title', 'Schlafmuster',
          'description', 'Ihre Schlafgewohnheiten',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q1-sleep-hours',
              'key', 'sleep_hours',
              'type', 'number',
              'label', 'Wie viele Stunden schlafen Sie durchschnittlich?',
              'required', true,
              'minValue', 0,
              'maxValue', 24
            ),
            jsonb_build_object(
              'id', 'q2-sleep-quality',
              'key', 'sleep_quality',
              'type', 'scale',
              'label', 'Wie bewerten Sie Ihre Schlafqualität? (1=sehr schlecht, 10=ausgezeichnet)',
              'required', true,
              'minValue', 1,
              'maxValue', 10
            )
          )
        ),
        jsonb_build_object(
          'id', 'step-2',
          'title', 'Schlafprobleme',
          'description', 'Häufige Schlafstörungen',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q3-sleep-issues',
              'key', 'sleep_issues',
              'type', 'checkbox',
              'label', 'Welche Schlafprobleme haben Sie?',
              'required', false,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'insomnia', 'label', 'Einschlafprobleme'),
                jsonb_build_object('value', 'waking', 'label', 'Häufiges Aufwachen'),
                jsonb_build_object('value', 'snoring', 'label', 'Schnarchen'),
                jsonb_build_object('value', 'apnea', 'label', 'Atemaussetzer'),
                jsonb_build_object('value', 'none', 'label', 'Keine')
              )
            )
          )
        ),
        jsonb_build_object(
          'id', 'step-3',
          'title', 'Schlafhygiene',
          'description', 'Ihre Schlafumgebung',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q4-bedroom-temp',
              'key', 'bedroom_temp',
              'type', 'radio',
              'label', 'Temperatur im Schlafzimmer',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'cold', 'label', 'Kalt (<16°C)'),
                jsonb_build_object('value', 'comfortable', 'label', 'Angenehm (16-20°C)'),
                jsonb_build_object('value', 'warm', 'label', 'Warm (>20°C)')
              )
            ),
            jsonb_build_object(
              'id', 'q5-screen-time',
              'key', 'screen_time',
              'type', 'radio',
              'label', 'Bildschirmzeit vor dem Schlafengehen',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'none', 'label', 'Keine'),
                jsonb_build_object('value', 'minimal', 'label', '<30 Minuten'),
                jsonb_build_object('value', 'moderate', 'label', '30-60 Minuten'),
                jsonb_build_object('value', 'high', 'label', '>60 Minuten')
              )
            )
          )
        )
      )
    ),
    -- Content manifest stub
    jsonb_build_object(
      'version', '1.0',
      'pages', jsonb_build_array(
        jsonb_build_object(
          'slug', 'intro',
          'title', 'Willkommen',
          'description', 'Sleep Quality Assessment',
          'sections', jsonb_build_array(
            jsonb_build_object(
              'key', 'hero',
              'type', 'hero',
              'content', jsonb_build_object(
                'title', 'Bewerten Sie Ihre Schlafqualität',
                'subtitle', 'Wissenschaftlich fundiertes Sleep Assessment'
              )
            ),
            jsonb_build_object(
              'key', 'intro-text',
              'type', 'text',
              'content', jsonb_build_object(
                'text', 'Guter Schlaf ist essentiell für Ihre Gesundheit und Ihr Wohlbefinden.'
              )
            )
          )
        ),
        jsonb_build_object(
          'slug', 'info-sleep-hygiene',
          'title', 'Schlafhygiene',
          'sections', jsonb_build_array(
            jsonb_build_object(
              'key', 'hygiene-info',
              'type', 'markdown',
              'content', jsonb_build_object(
                'markdown', '## Tipps für besseren Schlaf\n\nOptimieren Sie Ihre Schlafumgebung.'
              )
            )
          )
        ),
        jsonb_build_object(
          'slug', 'info-sleep-stages',
          'title', 'Schlafphasen',
          'sections', jsonb_build_array(
            jsonb_build_object(
              'key', 'stages-info',
              'type', 'markdown',
              'content', jsonb_build_object(
                'markdown', '## Die Phasen des Schlafs\n\nVerstehen Sie Ihren Schlafzyklus.'
              )
            )
          )
        )
      )
    )
  )
  ON CONFLICT (funnel_id, version) DO UPDATE SET
    is_default = EXCLUDED.is_default,
    rollout_percent = EXCLUDED.rollout_percent,
    algorithm_bundle_version = EXCLUDED.algorithm_bundle_version,
    prompt_version = EXCLUDED.prompt_version,
    questionnaire_config = EXCLUDED.questionnaire_config,
    content_manifest = EXCLUDED.content_manifest
  RETURNING id INTO v_version_id;

  -- Set default version reference
  UPDATE public.funnels_catalog
  SET default_version_id = v_version_id
  WHERE id = v_funnel_id;
END $$;

-- ============================================================
-- FUNNEL 3: Heart Health Nutrition Assessment
-- ============================================================

DO $$
DECLARE
  v_funnel_id UUID;
  v_version_id UUID;
BEGIN
  -- Insert or update funnel in catalog
  INSERT INTO public.funnels_catalog (slug, title, pillar_id, description, is_active, est_duration_min, outcomes)
  VALUES (
    'heart-health-nutrition',
    'Heart Health Nutrition',
    'nutrition',
    'Bewertung Ihrer Ernährungsgewohnheiten für optimale Herzgesundheit',
    true,
    12,
    '["Ernährungsmuster analysieren", "Herzgesunde Lebensmittel identifizieren", "Personalisierte Ernährungstipps erhalten"]'::jsonb
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    pillar_id = EXCLUDED.pillar_id,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    est_duration_min = EXCLUDED.est_duration_min,
    outcomes = EXCLUDED.outcomes
  RETURNING id INTO v_funnel_id;

  -- Insert funnel version with stub manifests
  INSERT INTO public.funnel_versions (
    funnel_id,
    version,
    is_default,
    rollout_percent,
    algorithm_bundle_version,
    prompt_version,
    questionnaire_config,
    content_manifest
  )
  VALUES (
    v_funnel_id,
    '1.0.0',
    true,
    100,
    'v0.5.0',
    '1.0',
    -- Questionnaire config stub
    jsonb_build_object(
      'version', '1.0',
      'steps', jsonb_build_array(
        jsonb_build_object(
          'id', 'step-1',
          'title', 'Essgewohnheiten',
          'description', 'Ihre täglichen Mahlzeiten',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q1-meals-per-day',
              'key', 'meals_per_day',
              'type', 'number',
              'label', 'Wie viele Mahlzeiten essen Sie pro Tag?',
              'required', true,
              'minValue', 1,
              'maxValue', 10
            ),
            jsonb_build_object(
              'id', 'q2-breakfast',
              'key', 'breakfast',
              'type', 'radio',
              'label', 'Essen Sie regelmäßig Frühstück?',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'daily', 'label', 'Täglich'),
                jsonb_build_object('value', 'sometimes', 'label', 'Manchmal'),
                jsonb_build_object('value', 'rarely', 'label', 'Selten'),
                jsonb_build_object('value', 'never', 'label', 'Nie')
              )
            )
          )
        ),
        jsonb_build_object(
          'id', 'step-2',
          'title', 'Lebensmittelgruppen',
          'description', 'Was Sie essen',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q3-vegetables',
              'key', 'vegetables',
              'type', 'scale',
              'label', 'Portionen Gemüse pro Tag',
              'required', true,
              'minValue', 0,
              'maxValue', 10
            ),
            jsonb_build_object(
              'id', 'q4-fruits',
              'key', 'fruits',
              'type', 'scale',
              'label', 'Portionen Obst pro Tag',
              'required', true,
              'minValue', 0,
              'maxValue', 10
            ),
            jsonb_build_object(
              'id', 'q5-whole-grains',
              'key', 'whole_grains',
              'type', 'radio',
              'label', 'Konsumieren Sie Vollkornprodukte?',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'always', 'label', 'Immer'),
                jsonb_build_object('value', 'often', 'label', 'Oft'),
                jsonb_build_object('value', 'sometimes', 'label', 'Manchmal'),
                jsonb_build_object('value', 'rarely', 'label', 'Selten')
              )
            )
          )
        ),
        jsonb_build_object(
          'id', 'step-3',
          'title', 'Fette und Proteine',
          'description', 'Ihre Nährstoffquellen',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q6-red-meat',
              'key', 'red_meat',
              'type', 'radio',
              'label', 'Wie oft essen Sie rotes Fleisch?',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'daily', 'label', 'Täglich'),
                jsonb_build_object('value', 'weekly', 'label', 'Wöchentlich'),
                jsonb_build_object('value', 'monthly', 'label', 'Monatlich'),
                jsonb_build_object('value', 'rarely', 'label', 'Selten/Nie')
              )
            ),
            jsonb_build_object(
              'id', 'q7-fish',
              'key', 'fish',
              'type', 'scale',
              'label', 'Portionen Fisch pro Woche',
              'required', true,
              'minValue', 0,
              'maxValue', 14
            )
          )
        ),
        jsonb_build_object(
          'id', 'step-4',
          'title', 'Salzkonsum',
          'description', 'Ihre Natriumaufnahme',
          'questions', jsonb_build_array(
            jsonb_build_object(
              'id', 'q8-salt',
              'key', 'salt',
              'type', 'radio',
              'label', 'Wie würden Sie Ihren Salzkonsum beschreiben?',
              'required', true,
              'options', jsonb_build_array(
                jsonb_build_object('value', 'low', 'label', 'Niedrig (selten salzen)'),
                jsonb_build_object('value', 'moderate', 'label', 'Moderat'),
                jsonb_build_object('value', 'high', 'label', 'Hoch (viel salzen)')
              )
            )
          )
        )
      )
    ),
    -- Content manifest stub
    jsonb_build_object(
      'version', '1.0',
      'pages', jsonb_build_array(
        jsonb_build_object(
          'slug', 'intro',
          'title', 'Willkommen',
          'description', 'Heart Health Nutrition Assessment',
          'sections', jsonb_build_array(
            jsonb_build_object(
              'key', 'hero',
              'type', 'hero',
              'content', jsonb_build_object(
                'title', 'Herzgesunde Ernährung',
                'subtitle', 'Optimieren Sie Ihre Ernährung für ein gesundes Herz'
              )
            ),
            jsonb_build_object(
              'key', 'intro-text',
              'type', 'text',
              'content', jsonb_build_object(
                'text', 'Ernährung spielt eine zentrale Rolle für Ihre Herzgesundheit.'
              )
            )
          )
        ),
        jsonb_build_object(
          'slug', 'info-mediterranean-diet',
          'title', 'Mittelmeerdiät',
          'sections', jsonb_build_array(
            jsonb_build_object(
              'key', 'mediterranean-info',
              'type', 'markdown',
              'content', jsonb_build_object(
                'markdown', '## Die Mittelmeerdiät\n\nEine herzgesunde Ernährungsweise.'
              )
            )
          )
        )
      )
    )
  )
  ON CONFLICT (funnel_id, version) DO UPDATE SET
    is_default = EXCLUDED.is_default,
    rollout_percent = EXCLUDED.rollout_percent,
    algorithm_bundle_version = EXCLUDED.algorithm_bundle_version,
    prompt_version = EXCLUDED.prompt_version,
    questionnaire_config = EXCLUDED.questionnaire_config,
    content_manifest = EXCLUDED.content_manifest
  RETURNING id INTO v_version_id;

  -- Set default version reference
  UPDATE public.funnels_catalog
  SET default_version_id = v_version_id
  WHERE id = v_funnel_id;
END $$;
