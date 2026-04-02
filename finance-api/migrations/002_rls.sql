-- ============================================================
-- RLS policies for financial_records and users tables
-- These use app.current_user_role set per-request by the backend
-- (Supabase's auth.jwt() only works with Supabase Auth, not custom JWTs)
-- ============================================================

-- Enable RLS on both tables
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Viewer can only read"   ON financial_records;
DROP POLICY IF EXISTS "Analyst can read"       ON financial_records;
DROP POLICY IF EXISTS "Admin full access"      ON financial_records;
DROP POLICY IF EXISTS "Admin manage users"     ON users;
DROP POLICY IF EXISTS "User view own profile"  ON users;

-- ── financial_records policies ────────────────────────────────

-- Viewer: SELECT only
CREATE POLICY "Viewer can only read"
  ON financial_records
  FOR SELECT
  USING (current_setting('app.current_user_role', true) = 'viewer');

-- Analyst: SELECT only
CREATE POLICY "Analyst can read"
  ON financial_records
  FOR SELECT
  USING (current_setting('app.current_user_role', true) = 'analyst');

-- Admin: full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin full access"
  ON financial_records
  FOR ALL
  USING (current_setting('app.current_user_role', true) = 'admin')
  WITH CHECK (current_setting('app.current_user_role', true) = 'admin');

-- ── users table policies ──────────────────────────────────────

-- Admin: full access to users table
CREATE POLICY "Admin manage users"
  ON users
  FOR ALL
  USING (current_setting('app.current_user_role', true) = 'admin')
  WITH CHECK (current_setting('app.current_user_role', true) = 'admin');

-- Any authenticated user: can read their own profile
CREATE POLICY "User view own profile"
  ON users
  FOR SELECT
  USING (
    id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
  );
