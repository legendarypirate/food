-- Safe additive migration for referral system (run manually against production).
-- Does NOT drop or truncate existing data.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(16),
  ADD COLUMN IF NOT EXISTS invited_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_unique
  ON users (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_invited_by_user_id_idx
  ON users (invited_by_user_id);

CREATE TABLE IF NOT EXISTS referral_clicks (
  click_id UUID PRIMARY KEY,
  referral_code VARCHAR(16) NOT NULL,
  inviter_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_hash VARCHAR(64),
  user_agent VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referral_clicks_code_created_idx
  ON referral_clicks (referral_code, created_at DESC);

CREATE INDEX IF NOT EXISTS referral_clicks_inviter_idx
  ON referral_clicks (inviter_user_id);

CREATE TABLE IF NOT EXISTS user_referrals (
  id SERIAL PRIMARY KEY,
  inviter_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  click_id UUID REFERENCES referral_clicks(click_id) ON DELETE SET NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'registered',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_referrals_status_check CHECK (status IN ('registered', 'completed'))
);

CREATE INDEX IF NOT EXISTS user_referrals_inviter_idx
  ON user_referrals (inviter_user_id);

-- sequelize.sync creates NOT NULL user FKs as NO ACTION, which blocks user deletes.
-- Replace whatever constraint is on these columns with the intended action.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT t.relname AS table_name, c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
    WHERE n.nspname = 'public'
      AND c.contype = 'f'
      AND (
        (t.relname = 'referral_clicks' AND a.attname = 'inviter_user_id')
        OR (t.relname = 'user_referrals' AND a.attname IN ('inviter_user_id', 'invitee_user_id', 'click_id'))
        OR (t.relname = 'users' AND a.attname = 'invited_by_user_id')
      )
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.table_name, r.conname);
  END LOOP;
END $$;

ALTER TABLE referral_clicks
  ADD CONSTRAINT referral_clicks_inviter_user_id_fkey
  FOREIGN KEY (inviter_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_referrals
  ADD CONSTRAINT user_referrals_inviter_user_id_fkey
  FOREIGN KEY (inviter_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_referrals
  ADD CONSTRAINT user_referrals_invitee_user_id_fkey
  FOREIGN KEY (invitee_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_referrals
  ADD CONSTRAINT user_referrals_click_id_fkey
  FOREIGN KEY (click_id) REFERENCES referral_clicks(click_id) ON DELETE SET NULL;

ALTER TABLE users
  ADD CONSTRAINT users_invited_by_user_id_fkey
  FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
