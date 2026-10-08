-- Store checkout phone on orders + backfill missing user phones from paid checkout metadata.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(32);

CREATE INDEX IF NOT EXISTS orders_contact_phone_idx ON orders (contact_phone);

-- Helper expression: metadata phone -> 8 MN digits (inline in queries below).

UPDATE orders o
SET contact_phone = '+976 ' || substring(d FROM 1 FOR 4) || '-' || substring(d FROM 5)
FROM (
  SELECT
    p.order_id,
    CASE
      WHEN length(dig) = 11 AND dig LIKE '976%' THEN substring(dig FROM 4)
      ELSE dig
    END AS d
  FROM qpay_payments p
  CROSS JOIN LATERAL (
    SELECT regexp_replace(p.metadata->>'phone', '[^0-9]', '', 'g') AS dig
  ) digits
  WHERE p.status = 'paid'
    AND p.order_id IS NOT NULL
    AND p.metadata->>'phone' IS NOT NULL
) src
WHERE o.id = src.order_id
  AND length(src.d) = 8
  AND (o.contact_phone IS NULL OR trim(o.contact_phone) = '');

WITH ranked AS (
  SELECT
    (p.metadata->>'userId')::integer AS user_id,
    p.metadata->>'phone' AS raw_phone,
    ROW_NUMBER() OVER (
      PARTITION BY (p.metadata->>'userId')
      ORDER BY COALESCE(p.paid_at, p.created_at) DESC
    ) AS rn
  FROM qpay_payments p
  WHERE p.status = 'paid'
    AND p.metadata->>'userId' ~ '^[0-9]+$'
    AND p.metadata->>'phone' IS NOT NULL
),
normalized AS (
  SELECT
    user_id,
    CASE
      WHEN length(dig) = 11 AND dig LIKE '976%' THEN substring(dig FROM 4)
      ELSE dig
    END AS d
  FROM ranked
  CROSS JOIN LATERAL (
    SELECT regexp_replace(raw_phone, '[^0-9]', '', 'g') AS dig
  ) digits
  WHERE rn = 1
)
UPDATE users u
SET phone = '+976 ' || substring(n.d FROM 1 FOR 4) || '-' || substring(n.d FROM 5)
FROM normalized n
WHERE u.id = n.user_id
  AND u.role = 'customer'
  AND length(n.d) = 8
  AND (
    u.phone IS NULL
    OR trim(u.phone) = ''
    OR length(regexp_replace(u.phone, '[^0-9]', '', 'g')) < 8
  );
