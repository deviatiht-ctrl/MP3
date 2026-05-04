-- ========================================
-- MP3 - Site Statistics Table
-- ========================================

-- Create table for site-wide statistics
CREATE TABLE IF NOT EXISTS public.site_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_key VARCHAR(50) UNIQUE NOT NULL,
  stat_value INTEGER NOT NULL DEFAULT 0,
  stat_label_ht VARCHAR(100),
  stat_label_fr VARCHAR(100),
  stat_label_en VARCHAR(100),
  stat_description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insert default statistics
INSERT INTO public.site_stats (stat_key, stat_value, stat_label_ht, stat_label_fr, stat_label_en) VALUES
  ('active_members', 2847, 'Manm Aktif', 'Membres Actifs', 'Active Members'),
  ('departments', 10, 'Depatman', 'Départements', 'Departments'),
  ('total_donations', 1500000, 'Total Ranmase', 'Total Collecté', 'Total Raised'),
  ('events_count', 45, 'Evenman', 'Événements', 'Events'),
  ('volunteers', 850, 'Volontè', 'Bénévoles', 'Volunteers')
ON CONFLICT (stat_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read stats
CREATE POLICY "Anyone can read site stats"
  ON public.site_stats
  FOR SELECT
  TO public
  USING (true);

-- Policy: Only admins can update stats
CREATE POLICY "Only admins can update site stats"
  ON public.site_stats
  FOR ALL
  TO authenticated
  USING (is_mp3_admin());

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_site_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_site_stats_timestamp ON public.site_stats;
CREATE TRIGGER update_site_stats_timestamp
  BEFORE UPDATE ON public.site_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_site_stats_timestamp();
