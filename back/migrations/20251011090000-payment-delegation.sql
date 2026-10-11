-- Safe additive migration for "Даалгах" (ask a friend to pay an order payment).
-- Does NOT drop or truncate existing data.

ALTER TABLE qpay_payments
  ADD COLUMN IF NOT EXISTS payer_user_id INTEGER,
  ADD COLUMN IF NOT EXISTS payer_phone VARCHAR(32),
  ADD COLUMN IF NOT EXISTS payer_note TEXT,
  ADD COLUMN IF NOT EXISTS payer_request_status VARCHAR(16),
  ADD COLUMN IF NOT EXISTS payer_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payer_responded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS qpay_payments_payer_user_id_idx
  ON qpay_payments (payer_user_id)
  WHERE payer_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS qpay_payments_payer_phone_idx
  ON qpay_payments (payer_phone)
  WHERE payer_phone IS NOT NULL;
