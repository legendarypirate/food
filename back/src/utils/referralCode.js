import crypto from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Collision-resistant, non-sequential referral codes (no 0/O/1/I). */
export function generateReferralCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export function normalizeReferralCode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function isValidReferralCodeFormat(code) {
  return /^[A-Z0-9]{6,16}$/.test(code);
}

export function buildReferralUrl(code) {
  const base = (process.env.APP_PUBLIC_URL || 'https://food.teensclub.mn').replace(/\/$/, '');
  return `${base}/invite/${encodeURIComponent(code)}`;
}
