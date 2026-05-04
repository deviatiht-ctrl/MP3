-- 01_schema.sql
-- Run first. Creates all tables for MP3 political party platform.

-- Site settings table - stores all party and site configuration
CREATE TABLE mp3_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  party_name text DEFAULT 'Mouvman Pèp pou Pwosperite ak Pwogrè',
  slogan text DEFAULT 'Nap koupe fache, Nap chanje',
  devise text DEFAULT 'KOMINOTE - EKITE - EFISYANS',
  logo_url text,
  address text DEFAULT 'Delmas, Haïti',
  contact_email text,
  facebook_url text,
  instagram_url text,
  twitter_url text,
  youtube_url text,
  moncash_number text,
  natcash_number text,
  stripe_publishable_key text,
  paypal_client_id text,
  bank_name text,
  bank_account text,
  bank_owner text,
  maintenance_mode boolean DEFAULT false,
  default_language text DEFAULT 'ht',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings
INSERT INTO mp3_settings (party_name) VALUES ('Mouvman Pèp pou Pwosperite ak Pwogrè');

-- Admin users table - defines who has admin access
CREATE TABLE mp3_admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Members table - party membership records
CREATE TABLE mp3_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  member_code text UNIQUE,
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  nin text,
  department text,
  commune text,
  address text,
  phone text,
  email text NOT NULL,
  photo_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','active','inactive','rejected')),
  engagement_signed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-generate member code function
CREATE OR REPLACE FUNCTION generate_member_code()
RETURNS text AS $$
BEGIN
  RETURN 'MP3-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM()*99999)::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set member code on insert
CREATE OR REPLACE FUNCTION set_member_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.member_code IS NULL THEN
    NEW.member_code := generate_member_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_member_code
BEFORE INSERT ON mp3_members
FOR EACH ROW EXECUTE FUNCTION set_member_code();

-- Candidates table - political candidates
CREATE TABLE mp3_candidats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  position text NOT NULL,
  department text,
  bio text,
  accomplishments text[],
  photo_url text,
  facebook_url text,
  instagram_url text,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- News/Actualites table - party news articles
CREATE TABLE mp3_actualites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE,
  content text,
  excerpt text,
  cover_image_url text,
  category text DEFAULT 'general',
  author text DEFAULT 'Ekip MP3',
  is_published boolean DEFAULT false,
  published_at timestamptz,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Events/Agenda table - party events and activities
CREATE TABLE mp3_agenda (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  event_end_date timestamptz,
  location text,
  location_url text,
  cover_image_url text,
  max_attendees integer,
  rsvp_enabled boolean DEFAULT true,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RSVPs table - event registrations
CREATE TABLE mp3_rsvps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES mp3_agenda(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  member_name text,
  member_email text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Donations table - contribution records
CREATE TABLE mp3_donations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_name text,
  donor_email text,
  donor_phone text,
  amount numeric NOT NULL,
  currency text DEFAULT 'HTG' CHECK (currency IN ('HTG','USD','EUR')),
  payment_method text NOT NULL CHECK (payment_method IN ('moncash','natcash','stripe','paypal','bank_transfer')),
  payment_reference text,
  cause text DEFAULT 'Fonjeneral MP3',
  message text,
  is_anonymous boolean DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed','refunded')),
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Donation causes table - fundraising campaigns
CREATE TABLE mp3_causes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  goal_amount numeric,
  raised_amount numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0
);

-- Update trigger function for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON mp3_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_members_updated BEFORE UPDATE ON mp3_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_actualites_updated BEFORE UPDATE ON mp3_actualites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
