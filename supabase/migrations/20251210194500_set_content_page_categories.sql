-- F6: Set category field for existing content pages
-- This migration updates content pages with appropriate categories based on their slugs

-- Update intro pages (shown before assessment)
UPDATE public.content_pages
SET category = 'intro'
WHERE slug IN ('intro-vorbereitung', 'ueber-das-assessment')
  AND category IS NULL;

-- Update info pages (additional information)
UPDATE public.content_pages
SET category = 'info'
WHERE slug IN ('info-wissenschaftliche-grundlage', 'was-ist-stress', 'schlaf-und-resilienz')
  AND category IS NULL;

-- Update result pages (shown after assessment completion)
UPDATE public.content_pages
SET category = 'result'
WHERE slug IN ('result-naechste-schritte')
  AND category IS NULL;

-- Set priority for intro pages (higher priority = shown first)
UPDATE public.content_pages
SET priority = 100
WHERE slug = 'intro-vorbereitung';

UPDATE public.content_pages
SET priority = 90
WHERE slug = 'ueber-das-assessment';
