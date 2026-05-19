-- 03_storage.sql
-- Run third. Storage buckets configuration.

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('candidate-photos', 'candidate-photos', true),
  ('news-images', 'news-images', true),
  ('event-images', 'event-images', true),
  ('mp3-membres', 'mp3-membres', false),
  ('mp3-settings', 'mp3-settings', true);

-- Bucket policies for candidates photos (public read)
CREATE POLICY "candidate_photos_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'candidate-photos');
CREATE POLICY "candidate_photos_admin_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'candidate-photos' AND EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  ));
CREATE POLICY "candidate_photos_admin_update" ON storage.objects FOR UPDATE
  WITH CHECK (bucket_id = 'candidate-photos' AND EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  ));
CREATE POLICY "candidate_photos_admin_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'candidate-photos' AND EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  ));

-- Bucket policies for news images (public read)
CREATE POLICY "news_images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'news-images');
CREATE POLICY "news_images_admin_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'news-images' AND EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  ));
CREATE POLICY "news_images_admin_update" ON storage.objects FOR UPDATE
  WITH CHECK (bucket_id = 'news-images' AND EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  ));
CREATE POLICY "news_images_admin_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'news-images' AND EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  ));

-- Bucket policies for event images (public read)
CREATE POLICY "event_images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');
CREATE POLICY "event_images_admin_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-images' AND EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  ));
CREATE POLICY "event_images_admin_update" ON storage.objects FOR UPDATE
  WITH CHECK (bucket_id = 'event-images' AND EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  ));
CREATE POLICY "event_images_admin_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'event-images' AND EXISTS (
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
