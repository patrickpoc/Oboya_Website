-- Per-user permission overrides for CMS Access Control (Super Admin).
ALTER TABLE cms_user_profiles
  ADD COLUMN IF NOT EXISTS permission_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;
