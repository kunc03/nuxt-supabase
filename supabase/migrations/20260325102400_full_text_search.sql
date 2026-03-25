-- Menambahkan kolom Generated untuk Full Text Search
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS fts_vector tsvector 
GENERATED ALWAYS AS (
    to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(sub_title, '') || ' ' || COALESCE(description, ''))
) STORED;

-- Membuat indeks GIN untuk pencarian cepat
CREATE INDEX IF NOT EXISTS fts_vector_idx ON public.products USING GIN (fts_vector);
