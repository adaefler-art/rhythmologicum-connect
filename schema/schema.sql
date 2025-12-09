-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.assessment_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL,
  question_id text NOT NULL,
  answer_value integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assessment_answers_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_answers_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id)
);
CREATE TABLE public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  funnel text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  funnel_id uuid,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  CONSTRAINT assessments_pkey PRIMARY KEY (id),
  CONSTRAINT assessments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patient_profiles(id),
  CONSTRAINT assessments_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES public.funnels(id)
);
CREATE TABLE public.content_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body_markdown text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  layout text DEFAULT 'default'::text,
  funnel_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT content_pages_pkey PRIMARY KEY (id),
  CONSTRAINT content_pages_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES public.funnels(id)
);
CREATE TABLE public.funnel_question_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  funnel_step_id uuid NOT NULL,
  rule_type text NOT NULL CHECK (rule_type = ANY (ARRAY['conditional_required'::text, 'conditional_visible'::text])),
  rule_payload jsonb NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT funnel_question_rules_pkey PRIMARY KEY (id),
  CONSTRAINT funnel_question_rules_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id),
  CONSTRAINT funnel_question_rules_funnel_step_id_fkey FOREIGN KEY (funnel_step_id) REFERENCES public.funnel_steps(id)
);
CREATE TABLE public.funnel_step_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  funnel_step_id uuid NOT NULL,
  question_id uuid NOT NULL,
  order_index integer NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT funnel_step_questions_pkey PRIMARY KEY (id),
  CONSTRAINT funnel_step_questions_funnel_step_id_fkey FOREIGN KEY (funnel_step_id) REFERENCES public.funnel_steps(id),
  CONSTRAINT funnel_step_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.funnel_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL,
  order_index integer NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT funnel_steps_pkey PRIMARY KEY (id),
  CONSTRAINT funnel_steps_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES public.funnels(id)
);
CREATE TABLE public.funnels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  default_theme text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT funnels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.patient_measures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  stress_score integer CHECK (stress_score IS NULL OR stress_score >= 0 AND stress_score <= 100),
  sleep_score integer CHECK (sleep_score IS NULL OR sleep_score >= 0 AND sleep_score <= 100),
  risk_level text NOT NULL CHECK (risk_level = ANY (ARRAY['low'::text, 'moderate'::text, 'high'::text, 'pending'::text])),
  report_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT patient_measures_pkey PRIMARY KEY (id),
  CONSTRAINT fk_patient_measures_patient FOREIGN KEY (patient_id) REFERENCES public.patient_profiles(id),
  CONSTRAINT fk_patient_measures_report FOREIGN KEY (report_id) REFERENCES public.reports(id)
);
CREATE TABLE public.patient_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  full_name text,
  birth_year integer,
  sex text,
  CONSTRAINT patient_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT patient_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  help_text text,
  question_type text NOT NULL,
  min_value integer,
  max_value integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT questions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL,
  score_numeric integer NOT NULL,
  risk_level text NOT NULL,
  report_text_short text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sleep_score integer,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id)
);
CREATE TABLE public.user_consents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_version text NOT NULL,
  consented_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  CONSTRAINT user_consents_pkey PRIMARY KEY (id),
  CONSTRAINT user_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
