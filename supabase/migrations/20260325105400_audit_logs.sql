-- Membuat tabel audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_record JSONB,
    new_record JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Memasang RLS agar audit log aman (hanya bisa dibaca admin)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to audit_logs" 
ON public.audit_logs 
FOR ALL 
TO authenticated 
USING (
  current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role' = 'admin'
)
WITH CHECK (
  current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role' = 'admin'
);
