-- Buat Bucket 'products' jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Kebijakan untuk Bucket 'products'

-- 1. Izinkan akses SELECT (Baca) untuk semua orang (anon dan authenticated)
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'products' );

-- 2. Izinkan INSERT (Upload) hanya untuk user authenticated (Admin)
CREATE POLICY "Authenticated Insert" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'products' );

-- 3. Izinkan UPDATE hanya untuk user authenticated (Admin)
CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'products' );

-- 4. Izinkan DELETE hanya untuk user authenticated (Admin)
CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'products' );
