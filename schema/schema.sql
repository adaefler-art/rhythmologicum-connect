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
  CONSTRAINT assessments_pkey PRIMARY KEY (id),
  CONSTRAINT assessments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patient_profiles(id)
);
CREATE TABLE public.patient_measures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  stress_score integer CHECK (stress_score IS NULL OR stress_score >= 0 AND stress_score <= 100),
  sleep_score integer CHECK (sleep_score IS NULL OR sleep_score >= 0 AND sleep_score <= 100),
  risk_level text NOT NULL,
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