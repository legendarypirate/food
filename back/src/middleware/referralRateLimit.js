const buckets = new Map();

function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip;
  return ip || 'unknown';
}

/** Simple in-memory rate limit for public referral endpoints. */
export function referralRateLimit({ windowMs = 60_000, max = 60 } = {}) {
  return (req, res, next) => {
    const key = `${req.path}:${clientKey(req)}`;
    const now = Date.now();
    let entry = buckets.get(key);
    if (!entry || now - entry.start > windowMs) {
      entry = { start: now, count: 0 };
      buckets.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      return res.status(429).json({ error: 'Хэт олон хүсэлт. Түр хүлээнэ үү.' });
    }
    return next();
  };
}
