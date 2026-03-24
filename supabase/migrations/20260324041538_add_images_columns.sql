-- Migration to add images array for product details
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.products.images IS 'Array of URLs for product detail images';
