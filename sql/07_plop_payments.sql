-- 07_plop_payments.sql
-- PLOP PLOP payment integration — run after 01_schema.sql
-- Prefix mp3_ used on all tables to avoid conflicts with other Supabase projects.

-- ── 1. Add kashpaw to allowed payment methods ─────────────────────────────
ALTER TABLE mp3_donations
  DROP CONSTRAINT IF EXISTS mp3_donations_payment_method_check;

ALTER TABLE mp3_donations
  ADD CONSTRAINT mp3_donations_payment_method_check
  CHECK (payment_method IN ('moncash','natcash','kashpaw','stripe','paypal','bank_transfer'));

-- ── 2. Add PLOP PLOP client_id to settings (secret stays in Supabase env) ─
ALTER TABLE mp3_settings
  ADD COLUMN IF NOT EXISTS plop_client_id text;

-- ── 3. PLOP PLOP transaction tracking ─────────────────────────────────────
CREATE TABLE mp3_plop_transactions (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id         uuid        REFERENCES mp3_donations(id) ON DELETE SET NULL,
  plop_reference_id   text        UNIQUE NOT NULL,
  plop_transaction_id text,
  amount              numeric     NOT NULL,
  currency            text        DEFAULT 'HTG',
  method              text        NOT NULL
                                  CHECK (method IN ('moncash','natcash','kashpaw','all')),
  redirect_url        text,
  status              text        DEFAULT 'pending'
                                  CHECK (status IN ('pending','confirmed','failed')),
  verified_at         timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TRIGGER trg_mp3_plop_transactions_updated
  BEFORE UPDATE ON mp3_plop_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 4. Withdrawal history (admin) ─────────────────────────────────────────
CREATE TABLE mp3_plop_withdrawals (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  amount              numeric     NOT NULL,
  fee                 numeric,
  total               numeric,
  method              text        NOT NULL CHECK (method IN ('moncash','natcash')),
  recipient           text        NOT NULL,
  reference           text        UNIQUE NOT NULL,
  plop_transaction_id text,
  api_reference       text,
  status              text        DEFAULT 'pending'
                                  CHECK (status IN ('pending','success','failed')),
  balance_before      numeric,
  balance_after       numeric,
  created_at          timestamptz DEFAULT now()
);

-- ── 5. RLS policies ───────────────────────────────────────────────────────
ALTER TABLE mp3_plop_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp3_plop_withdrawals  ENABLE ROW LEVEL SECURITY;

-- Anon can insert (Edge Function uses service role key, bypasses RLS)
-- Admins only can read
CREATE POLICY "mp3_plop_transactions_admin_read"
  ON mp3_plop_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mp3_admins WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "mp3_plop_withdrawals_admin_read"
  ON mp3_plop_withdrawals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mp3_admins WHERE email = auth.jwt() ->> 'email'
    )
  );
