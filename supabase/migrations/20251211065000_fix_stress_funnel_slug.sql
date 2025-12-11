-- Migration: Fix stress funnel slug from 'stress' to 'stress-assessment'
-- This corrective migration ensures the funnel slug matches what downstream
-- migrations and application code expect (stress-assessment instead of stress)

-- Update the funnel slug if it exists with the old value
UPDATE public.funnels
SET 
  slug = 'stress-assessment',
  updated_at = now()
WHERE slug = 'stress';

-- Log the result for verification
DO $$
DECLARE
  funnel_count integer;
BEGIN
  SELECT COUNT(*) INTO funnel_count
  FROM public.funnels
  WHERE slug = 'stress-assessment';
  
  IF funnel_count > 0 THEN
    RAISE NOTICE 'Funnel slug successfully updated to stress-assessment';
  ELSE
    RAISE NOTICE 'No funnel found - migration may need to run after populate_stress_questions';
  END IF;
END $$;
