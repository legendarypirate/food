-- Phone verification + referral reward tracking (additive only).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Existing customers with a valid stored MN mobile are treated as already verified.
UPDATE users
SET phone_verified_at = COALESCE(phone_verified_at, created_at)
WHERE role = 'customer'
  AND phone_verified_at IS NULL
  AND length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 8;
