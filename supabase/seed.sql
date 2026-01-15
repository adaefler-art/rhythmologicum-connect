-- ============================================================
-- SEED DATA FOR RHYTHMOLOGICUM CONNECT PILOT
-- ============================================================
-- 
-- Purpose: Deterministic seed data for development, staging, and demo environments
-- Issue: E6.4.10 — Seed/Fixture: Pilot Org + Test Patients + 2 Funnels + Workup States
--
-- This seed file creates:
-- 1. Pilot Organization
-- 2. Test Users (admin, clinician, patients)
-- 3. User roles and org memberships
-- 4. Patient profiles with completed onboarding
-- 5. User consents
-- 6. Ensures 2 pilot funnels exist (stress-assessment, sleep-quality)
-- 7. Workup default states
--
-- IMPORTANT: All UUIDs are deterministic for reproducibility
-- ============================================================

-- ============================================================
-- 1. PILOT ORGANIZATION
-- ============================================================

INSERT INTO public.organizations (id, name, slug, settings, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Pilot Organization',
  'pilot-org',
  jsonb_build_object(
    'pilot_enabled', true,
    'features', jsonb_build_array('funnels', 'assessments', 'workup')
  ),
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  settings = EXCLUDED.settings,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- 2. TEST USERS (via auth.users)
-- ============================================================

-- Note: These INSERT statements will only work if auth.users exists
-- and if we're running in a local Supabase environment.
-- For production/hosted, users should be created via Supabase Auth API.

DO $$
BEGIN
  -- Check if auth.users exists
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_namespace n
    JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users'
  ) THEN

    -- Admin User
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    )
    VALUES (
      '10000000-0000-0000-0000-000000000001'::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'admin@pilot.test',
      crypt('admin123', gen_salt('bf')), -- Password: admin123
      NOW(),
      jsonb_build_object('role', 'admin'),
      jsonb_build_object('display_name', 'Admin User'),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      raw_app_meta_data = EXCLUDED.raw_app_meta_data,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = NOW();

    -- Clinician User
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    )
    VALUES (
      '10000000-0000-0000-0000-000000000002'::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'clinician@pilot.test',
      crypt('clinician123', gen_salt('bf')), -- Password: clinician123
      NOW(),
      jsonb_build_object('role', 'clinician'),
      jsonb_build_object('display_name', 'Dr. Müller'),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      raw_app_meta_data = EXCLUDED.raw_app_meta_data,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = NOW();

    -- Test Patient 1
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    )
    VALUES (
      '10000000-0000-0000-0000-000000000101'::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'patient1@pilot.test',
      crypt('patient123', gen_salt('bf')), -- Password: patient123
      NOW(),
      jsonb_build_object('role', 'patient'),
      jsonb_build_object('display_name', 'Max Mustermann'),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      raw_app_meta_data = EXCLUDED.raw_app_meta_data,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = NOW();

    -- Test Patient 2
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    )
    VALUES (
      '10000000-0000-0000-0000-000000000102'::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'patient2@pilot.test',
      crypt('patient123', gen_salt('bf')), -- Password: patient123
      NOW(),
      jsonb_build_object('role', 'patient'),
      jsonb_build_object('display_name', 'Erika Musterfrau'),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      raw_app_meta_data = EXCLUDED.raw_app_meta_data,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = NOW();

    -- Test Patient 3 (eligible but not yet onboarded)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    )
    VALUES (
      '10000000-0000-0000-0000-000000000103'::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'patient3@pilot.test',
      crypt('patient123', gen_salt('bf')), -- Password: patient123
      NOW(),
      jsonb_build_object('role', 'patient'),
      jsonb_build_object('display_name', 'Anna Schmidt'),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      raw_app_meta_data = EXCLUDED.raw_app_meta_data,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = NOW();

  END IF;
END $$;

-- ============================================================
-- 3. USER PROFILES (for user_profiles table if it exists)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    -- Admin profile
    INSERT INTO public.user_profiles (id, user_id, organization_id, display_name, metadata, created_at, updated_at)
    VALUES (
      '20000000-0000-0000-0000-000000000001'::uuid,
      '10000000-0000-0000-0000-000000000001'::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid,
      'Admin User',
      jsonb_build_object('pilot_enabled', true, 'role', 'admin'),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      organization_id = EXCLUDED.organization_id,
      display_name = EXCLUDED.display_name,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

    -- Clinician profile
    INSERT INTO public.user_profiles (id, user_id, organization_id, display_name, metadata, created_at, updated_at)
    VALUES (
      '20000000-0000-0000-0000-000000000002'::uuid,
      '10000000-0000-0000-0000-000000000002'::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid,
      'Dr. Müller',
      jsonb_build_object('pilot_enabled', true, 'role', 'clinician'),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      organization_id = EXCLUDED.organization_id,
      display_name = EXCLUDED.display_name,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

    -- Patient 1 profile
    INSERT INTO public.user_profiles (id, user_id, organization_id, display_name, metadata, created_at, updated_at)
    VALUES (
      '20000000-0000-0000-0000-000000000101'::uuid,
      '10000000-0000-0000-0000-000000000101'::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid,
      'Max Mustermann',
      jsonb_build_object('pilot_enabled', true, 'role', 'patient'),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      organization_id = EXCLUDED.organization_id,
      display_name = EXCLUDED.display_name,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

    -- Patient 2 profile
    INSERT INTO public.user_profiles (id, user_id, organization_id, display_name, metadata, created_at, updated_at)
    VALUES (
      '20000000-0000-0000-0000-000000000102'::uuid,
      '10000000-0000-0000-0000-000000000102'::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid,
      'Erika Musterfrau',
      jsonb_build_object('pilot_enabled', true, 'role', 'patient'),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      organization_id = EXCLUDED.organization_id,
      display_name = EXCLUDED.display_name,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

    -- Patient 3 profile
    INSERT INTO public.user_profiles (id, user_id, organization_id, display_name, metadata, created_at, updated_at)
    VALUES (
      '20000000-0000-0000-0000-000000000103'::uuid,
      '10000000-0000-0000-0000-000000000103'::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid,
      'Anna Schmidt',
      jsonb_build_object('pilot_enabled', true, 'role', 'patient'),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      organization_id = EXCLUDED.organization_id,
      display_name = EXCLUDED.display_name,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();
  END IF;
END $$;

-- ============================================================
-- 4. USER ORG MEMBERSHIP
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_org_membership'
  ) THEN
    -- Admin membership
    INSERT INTO public.user_org_membership (user_id, organization_id, role, is_active, created_at, updated_at)
    VALUES (
      '10000000-0000-0000-0000-000000000001'::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid,
      'admin',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();

    -- Clinician membership
    INSERT INTO public.user_org_membership (user_id, organization_id, role, is_active, created_at, updated_at)
    VALUES (
      '10000000-0000-0000-0000-000000000002'::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid,
      'clinician',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();

    -- Patient 1 membership
    INSERT INTO public.user_org_membership (user_id, organization_id, role, is_active, created_at, updated_at)
    VALUES (
      '10000000-0000-0000-0000-000000000101'::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid,
      'patient',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();

    -- Patient 2 membership
    INSERT INTO public.user_org_membership (user_id, organization_id, role, is_active, created_at, updated_at)
    VALUES (
      '10000000-0000-0000-0000-000000000102'::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid,
      'patient',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();

    -- Patient 3 membership
    INSERT INTO public.user_org_membership (user_id, organization_id, role, is_active, created_at, updated_at)
    VALUES (
      '10000000-0000-0000-0000-000000000103'::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid,
      'patient',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  END IF;
END $$;

-- ============================================================
-- 5. PATIENT PROFILES (legacy table)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'patient_profiles'
  ) THEN
    -- Check if onboarding_status column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'patient_profiles' 
        AND column_name = 'onboarding_status'
    ) THEN
      -- Patient 1 (completed onboarding)
      INSERT INTO public.patient_profiles (id, user_id, full_name, birth_year, sex, onboarding_status, created_at)
      VALUES (
        '30000000-0000-0000-0000-000000000101'::uuid,
        '10000000-0000-0000-0000-000000000101'::uuid,
        'Max Mustermann',
        1985,
        'male',
        'completed',
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        birth_year = EXCLUDED.birth_year,
        sex = EXCLUDED.sex,
        onboarding_status = EXCLUDED.onboarding_status;

      -- Patient 2 (completed onboarding)
      INSERT INTO public.patient_profiles (id, user_id, full_name, birth_year, sex, onboarding_status, created_at)
      VALUES (
        '30000000-0000-0000-0000-000000000102'::uuid,
        '10000000-0000-0000-0000-000000000102'::uuid,
        'Erika Musterfrau',
        1978,
        'female',
        'completed',
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        birth_year = EXCLUDED.birth_year,
        sex = EXCLUDED.sex,
        onboarding_status = EXCLUDED.onboarding_status;

      -- Patient 3 (not yet onboarded - to test happy path)
      INSERT INTO public.patient_profiles (id, user_id, full_name, birth_year, sex, onboarding_status, created_at)
      VALUES (
        '30000000-0000-0000-0000-000000000103'::uuid,
        '10000000-0000-0000-0000-000000000103'::uuid,
        NULL,
        NULL,
        NULL,
        'not_started',
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        onboarding_status = EXCLUDED.onboarding_status;
    ELSE
      -- Fallback if onboarding_status doesn't exist
      INSERT INTO public.patient_profiles (id, user_id, full_name, birth_year, sex, created_at)
      VALUES (
        '30000000-0000-0000-0000-000000000101'::uuid,
        '10000000-0000-0000-0000-000000000101'::uuid,
        'Max Mustermann',
        1985,
        'male',
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        birth_year = EXCLUDED.birth_year,
        sex = EXCLUDED.sex;

      INSERT INTO public.patient_profiles (id, user_id, full_name, birth_year, sex, created_at)
      VALUES (
        '30000000-0000-0000-0000-000000000102'::uuid,
        '10000000-0000-0000-0000-000000000102'::uuid,
        'Erika Musterfrau',
        1978,
        'female',
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        birth_year = EXCLUDED.birth_year,
        sex = EXCLUDED.sex;

      INSERT INTO public.patient_profiles (id, user_id, full_name, birth_year, sex, created_at)
      VALUES (
        '30000000-0000-0000-0000-000000000103'::uuid,
        '10000000-0000-0000-0000-000000000103'::uuid,
        NULL,
        NULL,
        NULL,
        NOW()
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;
END $$;

-- ============================================================
-- 6. USER CONSENTS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_consents'
  ) THEN
    -- Patient 1 consent
    INSERT INTO public.user_consents (user_id, consent_version, consented_at, ip_address, user_agent)
    VALUES (
      '10000000-0000-0000-0000-000000000101'::uuid,
      '1.0',
      NOW(),
      '127.0.0.1',
      'Pilot Seed Script'
    )
    ON CONFLICT (user_id, consent_version) DO UPDATE SET
      consented_at = NOW();

    -- Patient 2 consent
    INSERT INTO public.user_consents (user_id, consent_version, consented_at, ip_address, user_agent)
    VALUES (
      '10000000-0000-0000-0000-000000000102'::uuid,
      '1.0',
      NOW(),
      '127.0.0.1',
      'Pilot Seed Script'
    )
    ON CONFLICT (user_id, consent_version) DO UPDATE SET
      consented_at = NOW();

    -- Note: Patient 3 has no consent yet - to test happy path consent flow
  END IF;
END $$;

-- ============================================================
-- 7. ENSURE PILOT FUNNELS EXIST
-- ============================================================

-- The stress-assessment funnel should already exist from migrations
-- This section ensures both pilot funnels are present

DO $$
DECLARE
  v_stress_funnel_id UUID;
  v_sleep_funnel_id UUID;
BEGIN
  -- Ensure stress-assessment funnel exists
  SELECT id INTO v_stress_funnel_id FROM public.funnels_catalog WHERE slug = 'stress-assessment';
  
  IF v_stress_funnel_id IS NULL THEN
    INSERT INTO public.funnels_catalog (slug, title, pillar_id, description, is_active, est_duration_min, outcomes)
    VALUES (
      'stress-assessment',
      'Stress Assessment',
      'mental-health',
      'Ein wissenschaftlich validiertes Assessment zur Messung von Stress und psychischer Belastung',
      true,
      10,
      '["Stresslevel ermitteln", "Risikofaktoren identifizieren", "Handlungsempfehlungen erhalten"]'::jsonb
    )
    RETURNING id INTO v_stress_funnel_id;
    
    -- Create default version for stress funnel
    INSERT INTO public.funnel_versions (
      funnel_id,
      version,
      is_default,
      rollout_percent,
      questionnaire_config,
      content_manifest
    )
    VALUES (
      v_stress_funnel_id,
      '1.0.0',
      true,
      100,
      '{"version": "1.0", "steps": [{"id": "step-1", "title": "Stress Assessment"}]}'::jsonb,
      '{"pages": []}'::jsonb
    );
  END IF;

  -- Ensure sleep-quality funnel exists (from V05-I02.3 migration)
  SELECT id INTO v_sleep_funnel_id FROM public.funnels_catalog WHERE slug = 'sleep-quality';
  
  IF v_sleep_funnel_id IS NULL THEN
    INSERT INTO public.funnels_catalog (slug, title, pillar_id, description, is_active, est_duration_min, outcomes)
    VALUES (
      'sleep-quality',
      'Sleep Quality Assessment',
      'sleep',
      'Bewertung Ihrer Schlafqualität und Identifikation von Verbesserungspotenzialen',
      true,
      8,
      '["Schlafqualität ermitteln", "Schlafstörungen erkennen", "Empfehlungen für besseren Schlaf"]'::jsonb
    )
    RETURNING id INTO v_sleep_funnel_id;

    -- Create default version for sleep funnel
    INSERT INTO public.funnel_versions (
      funnel_id,
      version,
      is_default,
      rollout_percent,
      questionnaire_config,
      content_manifest
    )
    VALUES (
      v_sleep_funnel_id,
      '1.0.0',
      true,
      100,
      '{"version": "1.0", "steps": [{"id": "step-1", "title": "Sleep Quality"}]}'::jsonb,
      '{"pages": []}'::jsonb
    );
  END IF;
END $$;

-- ============================================================
-- 8. WORKUP DEFAULT STATES
-- ============================================================

-- Note: workup_status is added to assessments table via migration 20260115050033_e6_4_4_workup_status.sql
-- The enum values are: needs_more_data, ready_for_review
-- Default is NULL for in-progress assessments

-- No seed data needed here as workup_status is set dynamically by the assessment completion flow
-- This section is a placeholder for future workup-related seed data if needed

-- ============================================================
-- SEED COMPLETE
-- ============================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Pilot seed data loaded successfully';
  RAISE NOTICE 'Test users created:';
  RAISE NOTICE '  - admin@pilot.test (password: admin123)';
  RAISE NOTICE '  - clinician@pilot.test (password: clinician123)';
  RAISE NOTICE '  - patient1@pilot.test (password: patient123) - onboarded';
  RAISE NOTICE '  - patient2@pilot.test (password: patient123) - onboarded';
  RAISE NOTICE '  - patient3@pilot.test (password: patient123) - not onboarded';
  RAISE NOTICE 'Pilot Organization: pilot-org (ID: 00000000-0000-0000-0000-000000000001)';
  RAISE NOTICE 'Funnels: stress-assessment, sleep-quality';
END $$;
