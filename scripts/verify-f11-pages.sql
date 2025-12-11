-- Verification script for F11 seed pages
-- This script can be run to verify that all 10 base pages were created correctly

-- Check total count of pages for stress-assessment funnel
SELECT 
  'Total Pages' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 10 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 10 pages'
  END as result
FROM content_pages
WHERE funnel_id = (
  SELECT id FROM funnels WHERE slug = 'stress-assessment'
);

-- Check all pages are published
SELECT 
  'Published Status' as check_name,
  COUNT(*) as published_count,
  CASE 
    WHEN COUNT(*) = 10 THEN '✅ PASS - All pages published'
    ELSE '❌ FAIL - Not all pages are published'
  END as result
FROM content_pages
WHERE funnel_id = (
  SELECT id FROM funnels WHERE slug = 'stress-assessment'
)
AND status = 'published';

-- List all pages with their details
SELECT 
  slug,
  title,
  status,
  layout,
  LENGTH(body_markdown) as content_length,
  created_at,
  updated_at
FROM content_pages
WHERE funnel_id = (
  SELECT id FROM funnels WHERE slug = 'stress-assessment'
)
ORDER BY slug;

-- Check for duplicate slugs (should be 0)
SELECT 
  'Unique Slugs' as check_name,
  COUNT(DISTINCT slug) as unique_count,
  COUNT(*) as total_count,
  CASE 
    WHEN COUNT(DISTINCT slug) = COUNT(*) THEN '✅ PASS - All slugs unique'
    ELSE '❌ FAIL - Duplicate slugs found'
  END as result
FROM content_pages
WHERE funnel_id = (
  SELECT id FROM funnels WHERE slug = 'stress-assessment'
);

-- List expected slugs and check if they exist
WITH expected_slugs AS (
  SELECT unnest(ARRAY[
    'was-ist-stress',
    'schlaf-und-resilienz',
    'ueber-das-assessment',
    'intro-vorbereitung',
    'result-naechste-schritte',
    'info-wissenschaftliche-grundlage',
    'stressbewaeltigung-techniken',
    'burnout-praevention',
    'work-life-balance',
    'resilienz-aufbauen'
  ]) as expected_slug
)
SELECT 
  e.expected_slug,
  CASE 
    WHEN cp.slug IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  cp.title,
  cp.layout
FROM expected_slugs e
LEFT JOIN content_pages cp ON e.expected_slug = cp.slug
  AND cp.funnel_id = (SELECT id FROM funnels WHERE slug = 'stress-assessment')
ORDER BY e.expected_slug;
