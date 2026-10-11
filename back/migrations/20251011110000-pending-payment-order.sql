-- Allow orders to exist before Wire/QPay payment succeeds (Даалгах flow).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'enum_orders_status'
      AND e.enumlabel = 'pending_payment'
  ) THEN
    ALTER TYPE enum_orders_status ADD VALUE 'pending_payment';
  END IF;
END $$;
