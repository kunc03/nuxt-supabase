-- Mengaktifkan ekstensi vector jika belum ada
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Menambahkan kolom embedding ke tabel products
-- Menggunakan 384 dimensi karena ini standar output BAAI/bge-small-en-v1.5 (Supabase AI)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Menghapus fungsi lama jika ada karena PostgreSQL tidak mengizinkan perubahan tipe return pada CREATE OR REPLACE
DROP FUNCTION IF EXISTS match_products_by_embedding(vector, float, int);

-- Membuat fungsi RPC untuk mencari produk berdasarkan kemiripan cosine (=> / <=>)
-- Semakin kecil distance (<=>) berarti semakin mirip
CREATE OR REPLACE FUNCTION match_products_by_embedding(
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  title text,
  description text,
  price bigint,
  stock bigint,
  category text,
  image_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.price,
    p.stock,
    p.category,
    p.image_url,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  -- Filter produk yang memiliki embedding dan skor kemiripan lebih besar dari threshold
  WHERE p.embedding IS NOT NULL 
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
