INSERT INTO storage.buckets (id, name, public) VALUES ('contract-documents', 'contract-documents', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload contract documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contract-documents');

CREATE POLICY "Authenticated users can read contract documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contract-documents');

CREATE POLICY "Authenticated users can delete own contract documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'contract-documents');