-- 02_rls.sql
-- Run second. Row Level Security policies for all tables.

-- Enable RLS on all tables
ALTER TABLE mp3_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp3_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp3_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp3_candidats ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp3_actualites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp3_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp3_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp3_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp3_causes ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_mp3_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mp3_admins WHERE email = auth.email()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Settings: public read, admin write
CREATE POLICY "settings_read" ON mp3_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin" ON mp3_settings FOR ALL USING (is_mp3_admin());

-- Admins: admin only
CREATE POLICY "admins_only" ON mp3_admins FOR ALL USING (is_mp3_admin());

-- Members: own record OR admin
CREATE POLICY "members_own_read" ON mp3_members FOR SELECT
  USING (auth.uid() = user_id OR is_mp3_admin());
CREATE POLICY "members_insert" ON mp3_members FOR INSERT WITH CHECK (true);
CREATE POLICY "members_own_update" ON mp3_members FOR UPDATE
  USING (auth.uid() = user_id OR is_mp3_admin());
CREATE POLICY "members_admin_delete" ON mp3_members FOR DELETE USING (is_mp3_admin());

-- Candidates: public read active, admin all
CREATE POLICY "candidats_public" ON mp3_candidats FOR SELECT
  USING (is_active = true OR is_mp3_admin());
CREATE POLICY "candidats_admin" ON mp3_candidats FOR ALL USING (is_mp3_admin());

-- News: public read published, admin all
CREATE POLICY "actualites_public" ON mp3_actualites FOR SELECT
  USING (is_published = true OR is_mp3_admin());
CREATE POLICY "actualites_admin" ON mp3_actualites FOR ALL USING (is_mp3_admin());

-- Agenda: public read published
CREATE POLICY "agenda_public" ON mp3_agenda FOR SELECT
  USING (is_published = true OR is_mp3_admin());
CREATE POLICY "agenda_admin" ON mp3_agenda FOR ALL USING (is_mp3_admin());

-- RSVPs: user own + admin
CREATE POLICY "rsvps_own" ON mp3_rsvps FOR ALL
  USING (auth.uid() = user_id OR is_mp3_admin());
CREATE POLICY "rsvps_insert" ON mp3_rsvps FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Donations: admin reads all, user sees own
CREATE POLICY "donations_own" ON mp3_donations FOR SELECT
  USING (auth.uid() = user_id OR is_mp3_admin());
CREATE POLICY "donations_insert" ON mp3_donations FOR INSERT WITH CHECK (true);
CREATE POLICY "donations_admin" ON mp3_donations FOR UPDATE USING (is_mp3_admin());

-- Causes: public read active, admin all
CREATE POLICY "causes_public" ON mp3_causes FOR SELECT USING (is_active = true OR is_mp3_admin());
CREATE POLICY "causes_admin" ON mp3_causes FOR ALL USING (is_mp3_admin());

-- =============================================
-- GRANTS: Allow anon + authenticated roles to
-- perform operations permitted by RLS policies
-- =============================================

-- Public tables: anon can read
GRANT SELECT ON mp3_settings   TO anon, authenticated;
GRANT SELECT ON mp3_candidats  TO anon, authenticated;
GRANT SELECT ON mp3_actualites TO anon, authenticated;
GRANT SELECT ON mp3_agenda     TO anon, authenticated;
GRANT SELECT ON mp3_causes     TO anon, authenticated;

-- Members: anon can INSERT (membership request), authenticated can SELECT/UPDATE own row
GRANT INSERT        ON mp3_members TO anon, authenticated;
GRANT SELECT, UPDATE ON mp3_members TO authenticated;

-- Donations: anyone can donate
GRANT INSERT ON mp3_donations TO anon, authenticated;
GRANT SELECT ON mp3_donations TO authenticated;

-- RSVPs: authenticated only
GRANT INSERT, SELECT ON mp3_rsvps TO authenticated;
