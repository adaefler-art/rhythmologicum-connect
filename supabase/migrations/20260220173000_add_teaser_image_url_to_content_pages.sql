-- Add teaser image URL for content-page based sliders/cards
ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS teaser_image_url text;

COMMENT ON COLUMN public.content_pages.teaser_image_url IS
  'Optional teaser image URL for card/slider presentation.';
