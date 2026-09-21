export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('976') && digits.length === 11) return digits.slice(3);
  return digits;
}

export function formatPhone(phone) {
  const digits = normalizePhone(phone);
  if (digits.length === 8) return `+976 ${digits.slice(0, 4)}-${digits.slice(4)}`;
  return String(phone || '').trim();
}

export function isValidMnPhone(phone) {
  return /^[6-9]\d{7}$/.test(normalizePhone(phone));
}
