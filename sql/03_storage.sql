-- 03_storage.sql
-- Run third. Storage buckets configuration.

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('mp3-candidats', 'mp3-candidats', true),
  ('mp3-actualites', 'mp3-actualites', true),
  ('mp3-membres', 'mp3-membres', false),
  ('mp3-settings', 'mp3-settings', true);

-- Bucket policies for candidates photos (public read)
CREATE POLICY "candidats_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'mp3-candidats');
CREATE POLICY "candidats_admin_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'mp3-candidats' AND EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  ));
CREATE POLICY "candidats_admin_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'mp3-candidats' AND EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  ));

-- Bucket policies for news images (public read)
CREATE POLICY "actualites_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'mp3-actualites');
CREATE POLICY "actualites_admin_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'mp3-actualites' AND EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  ));

-- Bucket policies for member photos (private, owner access)
CREATE POLICY "membres_own_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'mp3-membres' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "membres_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'mp3-membres');

-- Bucket policies for settings (logo, etc.)
CREATE POLICY "settings_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'mp3-settings');
CREATE POLICY "settings_admin_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'mp3-settings' AND EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  ));
