-- Menambahkan kebijakan khusus agar Server (Service Role / Webhooks) dapat melakukan Insert
CREATE POLICY "Enable insert for service_role" 
ON public.audit_logs 
FOR INSERT 
TO service_role
WITH CHECK (true);
-- Alternatif, jalankan jika service_role tidak mendukung: (berikan ke public tapi tanpa hak SELECT)
CREATE POLICY "Enable insert for all" 
ON public.audit_logs 
FOR INSERT 
TO public
WITH CHECK (true);
