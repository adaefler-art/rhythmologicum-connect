-- Verification Script: Check Supabase Migration Deployment Status
-- Run this in Supabase Dashboard → SQL Editor to verify migrations were applied correctly

-- 1. Check if stress-assessment funnel exists
SELECT 
  '1. Funnel Check' AS check_type,
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COALESCE(STRING_AGG(slug || ' (' || title || ')', ', '), 'No funnel found') AS details
FROM public.funnels
WHERE slug = 'stress-assessment';

-- 2. Check if old 'stress' slug still exists (should not exist)
SELECT 
  '2. Old Slug Check' AS check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  CASE 
    WHEN COUNT(*) = 0 THEN 'No old "stress" slug found (correct)'
    ELSE 'Old "stress" slug still exists (needs fix)'
  END AS details
FROM public.funnels
WHERE slug = 'stress';

-- 3. Check content pages count (should be 10)
SELECT 
  '3. Content Pages Count' AS check_type,
  CASE 
    WHEN COUNT(*) = 10 THEN '✓ PASS'
    WHEN COUNT(*) = 0 THEN '✗ FAIL - No pages'
    ELSE '⚠ WARN - Wrong count'
  END AS status,
  COUNT(*)::text || ' pages found (expected: 10)' AS details
FROM public.content_pages
WHERE funnel_id = (SELECT id FROM public.funnels WHERE slug = 'stress-assessment');

-- 4. Check all pages are published
SELECT 
  '4. Published Status' AS check_type,
  CASE 
    WHEN COUNT(CASE WHEN status != 'published' THEN 1 END) = 0 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  COUNT(CASE WHEN status = 'published' THEN 1 END)::text || ' published, ' ||
  COUNT(CASE WHEN status != 'published' THEN 1 END)::text || ' not published' AS details
FROM public.content_pages
WHERE funnel_id = (SELECT id FROM public.funnels WHERE slug = 'stress-assessment');

-- 5. List all content page slugs
SELECT 
  '5. Content Page Slugs' AS info,
  STRING_AGG(slug, ', ' ORDER BY slug) AS page_slugs
FROM public.content_pages
WHERE funnel_id = (SELECT id FROM public.funnels WHERE slug = 'stress-assessment');

-- 6. Check expected slugs are present
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
  ]) AS slug
),
actual_pages AS (
  SELECT slug
  FROM public.content_pages
  WHERE funnel_id = (SELECT id FROM public.funnels WHERE slug = 'stress-assessment')
)
SELECT 
  '6. Expected Pages' AS check_type,
  CASE 
    WHEN COUNT(e.slug) = COUNT(a.slug) AND COUNT(e.slug) = 10 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  'Expected: 10, Found: ' || COUNT(a.slug)::text || 
  CASE 
    WHEN COUNT(e.slug) > COUNT(a.slug) THEN ', Missing: ' || STRING_AGG(CASE WHEN a.slug IS NULL THEN e.slug END, ', ')
    ELSE ''
  END AS details
FROM expected_slugs e
LEFT JOIN actual_pages a ON e.slug = a.slug;

-- 7. Summary
SELECT 
  '=== SUMMARY ===' AS section,
  CASE 
    WHEN (
      -- Funnel exists with correct slug
      EXISTS (SELECT 1 FROM public.funnels WHERE slug = 'stress-assessment')
      AND NOT EXISTS (SELECT 1 FROM public.funnels WHERE slug = 'stress')
      AND (SELECT COUNT(*) FROM public.content_pages 
           WHERE funnel_id = (SELECT id FROM public.funnels WHERE slug = 'stress-assessment')) = 10
      AND (SELECT COUNT(*) FROM public.content_pages 
           WHERE funnel_id = (SELECT id FROM public.funnels WHERE slug = 'stress-assessment')
           AND status = 'published') = 10
    )
    THEN '✓ ALL CHECKS PASSED - Deployment successful!'
    ELSE '✗ SOME CHECKS FAILED - Review details above'
  END AS result;
