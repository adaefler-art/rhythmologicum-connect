-- Verification Script: Check Content Flow Mapping Schema Extension
-- Run this in Supabase Dashboard → SQL Editor to verify migration was applied correctly
-- Migration: 20251212220145_add_content_flow_mapping.sql

-- 1. Check if flow_step column exists in content_pages
SELECT 
  '1. flow_step Column Check' AS check_type,
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  CASE 
    WHEN COUNT(*) = 1 THEN 'flow_step column exists in content_pages'
    ELSE 'flow_step column NOT found in content_pages'
  END AS details
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'content_pages'
  AND column_name = 'flow_step';

-- 2. Check if order_index column exists in content_pages
SELECT 
  '2. order_index Column Check' AS check_type,
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  CASE 
    WHEN COUNT(*) = 1 THEN 'order_index column exists in content_pages'
    ELSE 'order_index column NOT found in content_pages'
  END AS details
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'content_pages'
  AND column_name = 'order_index';

-- 3. Check flow_step column properties
SELECT 
  '3. flow_step Properties' AS check_type,
  CASE 
    WHEN data_type = 'text' AND is_nullable = 'YES' THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  'Type: ' || data_type || ', Nullable: ' || is_nullable AS details
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'content_pages'
  AND column_name = 'flow_step';

-- 4. Check order_index column properties
SELECT 
  '4. order_index Properties' AS check_type,
  CASE 
    WHEN data_type = 'integer' AND is_nullable = 'YES' THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  'Type: ' || data_type || ', Nullable: ' || is_nullable AS details
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'content_pages'
  AND column_name = 'order_index';

-- 5. Check if idx_content_pages_flow_step index exists
SELECT 
  '5. flow_step Index Check' AS check_type,
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  CASE 
    WHEN COUNT(*) = 1 THEN 'idx_content_pages_flow_step index exists'
    ELSE 'idx_content_pages_flow_step index NOT found'
  END AS details
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'content_pages'
  AND indexname = 'idx_content_pages_flow_step';

-- 6. Check if idx_content_pages_funnel_flow index exists
SELECT 
  '6. Composite Index Check' AS check_type,
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  CASE 
    WHEN COUNT(*) = 1 THEN 'idx_content_pages_funnel_flow index exists'
    ELSE 'idx_content_pages_funnel_flow index NOT found'
  END AS details
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'content_pages'
  AND indexname = 'idx_content_pages_funnel_flow';

-- 7. Check if idx_content_pages_order_index index exists
SELECT 
  '7. order_index Index Check' AS check_type,
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  CASE 
    WHEN COUNT(*) = 1 THEN 'idx_content_pages_order_index index exists'
    ELSE 'idx_content_pages_order_index index NOT found'
  END AS details
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'content_pages'
  AND indexname = 'idx_content_pages_order_index';

-- 8. Test query: Content pages by funnel and flow_step
SELECT 
  '8. Query Test' AS check_type,
  '✓ PASS' AS status,
  'Query executed successfully. Found ' || COUNT(*)::text || ' content pages with flow_step assigned' AS details
FROM public.content_pages
WHERE flow_step IS NOT NULL;

-- 9. Check existing funnel_id column compatibility
SELECT 
  '9. funnel_id Column Check' AS check_type,
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status,
  CASE 
    WHEN COUNT(*) = 1 THEN 'funnel_id column exists (for composite index)'
    ELSE 'funnel_id column NOT found'
  END AS details
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'content_pages'
  AND column_name = 'funnel_id';

-- 10. Summary
SELECT 
  '=== SUMMARY ===' AS section,
  CASE 
    WHEN (
      -- Both columns exist
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'content_pages' AND column_name = 'flow_step'
      )
      AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'content_pages' AND column_name = 'order_index'
      )
      -- All three indexes exist
      AND EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'content_pages' AND indexname = 'idx_content_pages_flow_step'
      )
      AND EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'content_pages' AND indexname = 'idx_content_pages_funnel_flow'
      )
      AND EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'content_pages' AND indexname = 'idx_content_pages_order_index'
      )
    )
    THEN '✓ ALL CHECKS PASSED - Migration successful!'
    ELSE '✗ SOME CHECKS FAILED - Review details above'
  END AS result;

-- 11. Sample data structure (if any content pages exist)
SELECT 
  id,
  slug,
  title,
  funnel_id IS NOT NULL AS has_funnel,
  flow_step,
  order_index,
  status,
  created_at
FROM public.content_pages
LIMIT 5;
