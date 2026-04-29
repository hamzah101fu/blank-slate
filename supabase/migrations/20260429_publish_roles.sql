-- ============================================================
-- Guftugu: Publish / Draft system + Admin roles
-- DO NOT run automatically — review carefully before applying.
-- Run in the Supabase SQL editor or via supabase db push.
-- ============================================================

-- ── 1. Status column (draft | published) ──────────────────

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'published'));

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'published'));

ALTER TABLE stages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'published'));

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'published'));

-- ── 2. RLS: users only see published content ───────────────
-- Drop and recreate select policies for stages and questions
-- so that non-admins only read published rows.

-- courses: published only for non-admins
DROP POLICY IF EXISTS "courses_select" ON courses;
CREATE POLICY "courses_select" ON courses
  FOR SELECT USING (
    status = 'published'
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean IS TRUE
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'content_admin')
  );

-- units: published only for non-admins
DROP POLICY IF EXISTS "units_select" ON units;
CREATE POLICY "units_select" ON units
  FOR SELECT USING (
    status = 'published'
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean IS TRUE
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'content_admin')
  );

-- stages: published only for non-admins
DROP POLICY IF EXISTS "stages_select" ON stages;
CREATE POLICY "stages_select" ON stages
  FOR SELECT USING (
    status = 'published'
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean IS TRUE
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'content_admin')
  );

-- questions: published only for non-admins
DROP POLICY IF EXISTS "questions_select" ON questions;
CREATE POLICY "questions_select" ON questions
  FOR SELECT USING (
    status = 'published'
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean IS TRUE
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'content_admin')
  );

-- Allow admins to update status
DROP POLICY IF EXISTS "questions_update" ON questions;
CREATE POLICY "questions_update" ON questions
  FOR UPDATE USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean IS TRUE
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'content_admin')
  );

DROP POLICY IF EXISTS "stages_update" ON stages;
CREATE POLICY "stages_update" ON stages
  FOR UPDATE USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean IS TRUE
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'content_admin')
  );

DROP POLICY IF EXISTS "units_update" ON units;
CREATE POLICY "units_update" ON units
  FOR UPDATE USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean IS TRUE
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'content_admin')
  );

-- ── 3. Admin roles ─────────────────────────────────────────
-- Set a user's role (run once per admin):
--   UPDATE auth.users
--   SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'
--   WHERE email = 'you@example.com';
--
-- To promote hamzahag41@gmail.com to super_admin:
--   UPDATE auth.users
--   SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin", "is_admin": true}'
--   WHERE email = 'hamzahag41@gmail.com';

-- ── 4. admin_users table ───────────────────────────────────
-- Tracks who has admin access. Populated manually or via trigger.

CREATE TABLE IF NOT EXISTS admin_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  display_name text,
  role        text NOT NULL CHECK (role IN ('super_admin', 'content_admin')),
  invited_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- RLS for admin_users: only super_admins can read/write
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select" ON admin_users;
CREATE POLICY "admin_users_select" ON admin_users
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

DROP POLICY IF EXISTS "admin_users_insert" ON admin_users;
CREATE POLICY "admin_users_insert" ON admin_users
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

DROP POLICY IF EXISTS "admin_users_delete" ON admin_users;
CREATE POLICY "admin_users_delete" ON admin_users
  FOR DELETE USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    AND user_id <> auth.uid()  -- cannot remove yourself
  );

-- ── 5. admin_invites table ─────────────────────────────────
-- Tracks pending admin invitations.

CREATE TABLE IF NOT EXISTS admin_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  role        text NOT NULL CHECK (role IN ('super_admin', 'content_admin')),
  invited_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (email)
);

ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_invites_all" ON admin_invites;
CREATE POLICY "admin_invites_all" ON admin_invites
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- ── 6. Seed admin_users with existing admin ────────────────
-- After running this migration, add yourself to admin_users:
--
--   INSERT INTO admin_users (user_id, email, display_name, role)
--   SELECT id, email, raw_user_meta_data->>'full_name', 'super_admin'
--   FROM auth.users
--   WHERE email = 'hamzahag41@gmail.com'
--   ON CONFLICT (user_id) DO NOTHING;
