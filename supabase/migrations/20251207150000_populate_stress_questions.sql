-- Migration: Populate questions table with stress-check questions
-- This migration transfers the hardcoded questions from the stress-check page
-- into the database questions table and sets up the funnel structure

-- 1. Insert or update the stress funnel
INSERT INTO public.funnels (slug, title, subtitle, description, is_active)
VALUES (
  'stress',
  'Stress & Resilienz Check',
  'Stress & Resilienz',
  'Ihr persönlicher Stress- & Schlaf-Check. Bitte beantworten Sie die folgenden Fragen so gut es geht nach Ihrem Gefühl der letzten Wochen.',
  true
)
ON CONFLICT (slug) 
DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  updated_at = now();

-- 2. Create funnel steps for stress and sleep sections
-- Get the funnel_id for reference
DO $$
DECLARE
  v_funnel_id uuid;
  v_step_stress_id uuid;
  v_step_sleep_id uuid;
BEGIN
  -- Get funnel ID
  SELECT id INTO v_funnel_id FROM public.funnels WHERE slug = 'stress';

  -- Insert stress step
  INSERT INTO public.funnel_steps (funnel_id, order_index, title, description, type)
  VALUES (v_funnel_id, 1, 'Umgang mit Stress', 'Bereich: Umgang mit Stress', 'form')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_step_stress_id;

  -- If step already exists, get its id
  IF v_step_stress_id IS NULL THEN
    SELECT id INTO v_step_stress_id 
    FROM public.funnel_steps 
    WHERE funnel_id = v_funnel_id AND order_index = 1;
  END IF;

  -- Insert sleep step
  INSERT INTO public.funnel_steps (funnel_id, order_index, title, description, type)
  VALUES (v_funnel_id, 2, 'Schlaf & Erholung', 'Bereich: Schlaf & Erholung', 'form')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_step_sleep_id;

  -- If step already exists, get its id
  IF v_step_sleep_id IS NULL THEN
    SELECT id INTO v_step_sleep_id 
    FROM public.funnel_steps 
    WHERE funnel_id = v_funnel_id AND order_index = 2;
  END IF;

  -- 3. Insert questions into questions table
  -- Stress questions
  INSERT INTO public.questions (key, label, help_text, question_type, min_value, max_value)
  VALUES 
    ('stress_q1', 'Wie häufig fühlen Sie sich im Alltag gestresst?', NULL, 'scale', 0, 4),
    ('stress_q2', 'Fühlen Sie sich häufig überfordert?', NULL, 'scale', 0, 4),
    ('stress_q3', 'Wie oft hatten Sie das Gefühl, keine Kontrolle zu haben?', NULL, 'scale', 0, 4),
    ('stress_q4', 'Wie häufig reagieren Sie angespannt oder gereizt?', NULL, 'scale', 0, 4)
  ON CONFLICT (key) 
  DO UPDATE SET
    label = EXCLUDED.label,
    help_text = EXCLUDED.help_text,
    question_type = EXCLUDED.question_type,
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    updated_at = now();

  -- Sleep questions
  INSERT INTO public.questions (key, label, help_text, question_type, min_value, max_value)
  VALUES 
    ('sleep_q1', 'Wie gut schlafen Sie typischerweise ein?', NULL, 'scale', 0, 4),
    ('sleep_q2', 'Wie oft wachen Sie nachts auf?', NULL, 'scale', 0, 4),
    ('sleep_q3', 'Wie erholt fühlen Sie sich morgens beim Aufstehen?', NULL, 'scale', 0, 4),
    ('sleep_q4', 'Wie oft verspüren Sie Erschöpfung am Tag?', NULL, 'scale', 0, 4)
  ON CONFLICT (key) 
  DO UPDATE SET
    label = EXCLUDED.label,
    help_text = EXCLUDED.help_text,
    question_type = EXCLUDED.question_type,
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    updated_at = now();

  -- 4. Link questions to funnel steps
  -- Link stress questions to stress step
  INSERT INTO public.funnel_step_questions (funnel_step_id, question_id, order_index, is_required)
  SELECT 
    v_step_stress_id,
    q.id,
    CASE q.key
      WHEN 'stress_q1' THEN 1
      WHEN 'stress_q2' THEN 2
      WHEN 'stress_q3' THEN 3
      WHEN 'stress_q4' THEN 4
    END,
    true
  FROM public.questions q
  WHERE q.key IN ('stress_q1', 'stress_q2', 'stress_q3', 'stress_q4')
  ON CONFLICT DO NOTHING;

  -- Link sleep questions to sleep step
  INSERT INTO public.funnel_step_questions (funnel_step_id, question_id, order_index, is_required)
  SELECT 
    v_step_sleep_id,
    q.id,
    CASE q.key
      WHEN 'sleep_q1' THEN 1
      WHEN 'sleep_q2' THEN 2
      WHEN 'sleep_q3' THEN 3
      WHEN 'sleep_q4' THEN 4
    END,
    true
  FROM public.questions q
  WHERE q.key IN ('sleep_q1', 'sleep_q2', 'sleep_q3', 'sleep_q4')
  ON CONFLICT DO NOTHING;

END $$;

-- 5. Enable RLS policies for new tables (if not already enabled)
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_step_questions ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users to read funnel data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnels'
      AND policyname = 'Allow authenticated users to read funnels'
  ) THEN
    CREATE POLICY "Allow authenticated users to read funnels"
      ON public.funnels FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnel_steps'
      AND policyname = 'Allow authenticated users to read funnel_steps'
  ) THEN
    CREATE POLICY "Allow authenticated users to read funnel_steps"
      ON public.funnel_steps FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'questions'
      AND policyname = 'Allow authenticated users to read questions'
  ) THEN
    CREATE POLICY "Allow authenticated users to read questions"
      ON public.questions FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'funnel_step_questions'
      AND policyname = 'Allow authenticated users to read funnel_step_questions'
  ) THEN
    CREATE POLICY "Allow authenticated users to read funnel_step_questions"
      ON public.funnel_step_questions FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
