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
