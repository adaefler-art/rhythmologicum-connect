-- Example: Versioning Contract in Action
-- This file demonstrates how version tracking works end-to-end
-- Run after main migrations are applied

-- =============================================================================
-- EXAMPLE 1: Create a funnel with versioned configuration
-- =============================================================================

-- Insert funnel catalog entry
INSERT INTO public.funnels_catalog (id, slug, title, description, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'stress-demo',
    'Stress Assessment Demo',
    'Demo funnel for versioning contract',
    true
) ON CONFLICT (slug) DO NOTHING;

-- Create version 1.0.0 of the funnel
INSERT INTO public.funnel_versions (
    id,
    funnel_id,
    version,
    questionnaire_config,
    content_manifest,
    algorithm_bundle_version,
    prompt_version,
    is_default,
    rollout_percent
)
VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1.0.0',
    '{"steps": [{"id": "step1", "questions": ["stress_q1", "stress_q2"]}]}'::jsonb,
    '{"pages": [{"id": "intro", "slug": "intro"}]}'::jsonb,
    'v1.0.0',
    '1.0',
    true,
    100
) ON CONFLICT (funnel_id, version) DO NOTHING;

-- =============================================================================
-- EXAMPLE 2: Create assessment and versioned calculated results
-- =============================================================================

-- Note: This assumes patient_profiles exist
-- In real scenario, these would be created through the app

-- Example calculated_results with full version tracking
COMMENT ON TABLE public.calculated_results IS 
'V05-I01.3 Example:

INSERT INTO calculated_results (
    assessment_id,
    algorithm_version,
    funnel_version_id,
    scores,
    computed_at,
    inputs_hash
)
VALUES (
    ''{assessment_id}'',
    ''v1.0.0'',
    ''00000000-0000-0000-0000-000000000002''::uuid,
    ''{"stress_score": 75, "sleep_score": 60}''::jsonb,
    NOW(),
    ''e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855''
);

Unique constraint ensures: One result per (assessment_id, algorithm_version)
This prevents duplicate calculations for the same version.
';

-- =============================================================================
-- EXAMPLE 3: Create versioned report with all references
-- =============================================================================

COMMENT ON TABLE public.reports IS
'V05-I01.3 Example:

-- Generate deterministic report version
SELECT generate_report_version(
    ''1.0.0'',     -- funnel version
    ''v1.0.0'',    -- algorithm version
    ''1.0''        -- prompt version
);
-- Returns: 1.0.0-v1.0.0-1.0-20251231

INSERT INTO reports (
    assessment_id,
    report_version,
    prompt_version,
    algorithm_version,
    funnel_version_id,
    score_numeric,
    sleep_score,
    risk_level,
    report_text_short
)
VALUES (
    ''{assessment_id}'',
    ''1.0.0-v1.0.0-1.0-20251231'',
    ''1.0'',
    ''v1.0.0'',
    ''00000000-0000-0000-0000-000000000002''::uuid,
    75,
    60,
    ''moderate'',
    ''Your stress level is moderate...''
);

Unique constraint ensures: One report per (assessment_id, report_version)
This enables multiple report versions for same assessment if needed.
';

-- =============================================================================
-- EXAMPLE 4: Create report sections with prompt version
-- =============================================================================

COMMENT ON TABLE public.report_sections IS
'V05-I01.3 Example:

INSERT INTO report_sections (
    report_id,
    section_key,
    prompt_version,
    content,
    citations_meta
)
VALUES 
    (
        ''{report_id}'',
        ''summary'',
        ''1.0'',
        ''Based on your responses, you are experiencing moderate stress...'',
        ''{"sources": []}''::jsonb
    ),
    (
        ''{report_id}'',
        ''recommendations'',
        ''1.0'',
        ''We recommend: 1. Regular sleep schedule, 2. Stress management...'',
        ''{"sources": [{"id": "rec1", "type": "guideline"}]}''::jsonb
    );

Unique constraint ensures: One section per (report_id, section_key)
This prevents duplicate sections in the same report.
';

-- =============================================================================
-- EXAMPLE 5: Query to reconstruct "what did the system know"
-- =============================================================================

-- This query shows complete traceability for a report
COMMENT ON FUNCTION public.generate_report_version IS
'V05-I01.3 Example Query - Complete Traceability:

-- Reconstruct what the system knew when generating a report
SELECT 
    r.id as report_id,
    r.report_version,
    r.algorithm_version,
    r.prompt_version,
    fv.version as funnel_version,
    fv.questionnaire_config,
    fv.content_manifest,
    fv.algorithm_bundle_version as funnel_algorithm_version,
    fv.prompt_version as funnel_prompt_version,
    cr.scores,
    cr.inputs_hash,
    cr.computed_at,
    r.created_at as report_created_at,
    ARRAY_AGG(
        jsonb_build_object(
            ''section_key'', rs.section_key,
            ''prompt_version'', rs.prompt_version
        )
    ) as sections
FROM reports r
JOIN funnel_versions fv ON r.funnel_version_id = fv.id
LEFT JOIN calculated_results cr 
    ON cr.assessment_id = r.assessment_id 
    AND cr.algorithm_version = r.algorithm_version
LEFT JOIN report_sections rs ON rs.report_id = r.id
WHERE r.assessment_id = ''{assessment_id}''
GROUP BY r.id, fv.id, cr.id;

This query provides:
- Exact funnel configuration used
- Algorithm version used for scoring
- Prompt version(s) used for generation
- Input hash (for detecting equivalent runs)
- All timestamps for audit trail
- Section-level prompt versions
';

-- =============================================================================
-- EXAMPLE 6: Detecting equivalent runs with inputs_hash
-- =============================================================================

COMMENT ON COLUMN public.calculated_results.inputs_hash IS
'V05-I01.3 Example - Detecting Equivalent Runs:

-- Compute hash for new assessment
SELECT compute_inputs_hash(
    ''{"stress_q1": 3, "stress_q2": 4, "sleep_q1": 2}''::jsonb
);
-- Returns: SHA256 hex string

-- Check if we already calculated results for this input
SELECT 
    cr.id,
    cr.algorithm_version,
    cr.scores,
    cr.computed_at
FROM calculated_results cr
WHERE cr.inputs_hash = ''e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855''
  AND cr.algorithm_version = ''v1.0.0'';

-- If found: Use cached results (skip expensive computation)
-- If not found: Compute and store with this hash

This enables:
- Caching of expensive AI/algorithm operations
- Detecting duplicate assessments
- Performance optimization
- Cost reduction
';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check that unique constraints are in place
SELECT 
    tc.constraint_name,
    tc.table_name,
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('calculated_results', 'reports', 'report_sections')
GROUP BY tc.constraint_name, tc.table_name
ORDER BY tc.table_name, tc.constraint_name;

-- Expected results:
-- calculated_results | calculated_results_assessment_version_unique | assessment_id, algorithm_version
-- reports            | reports_assessment_version_unique             | assessment_id, report_version
-- report_sections    | report_sections_report_key_unique             | report_id, section_key

-- Check that helper functions exist
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('generate_report_version', 'compute_inputs_hash')
ORDER BY routine_name;

-- Expected results:
-- generate_report_version | FUNCTION | text
-- compute_inputs_hash     | FUNCTION | text
