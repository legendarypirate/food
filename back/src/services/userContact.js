import { User } from '../models/index.js';
import { formatPhone, isValidMnPhone, normalizePhone } from '../utils/phone.js';

export function isMissingUserPhone(phone) {
  const digits = normalizePhone(phone);
  return digits.length < 8;
}

/** Persist checkout phone/address on the customer profile (does not set phoneVerifiedAt). */
export async function syncUserCheckoutContact(userOrId, { phone, deliveryAddress } = {}) {
  const user =
    userOrId instanceof User ? userOrId : await User.findByPk(userOrId);
  if (!user || user.role !== 'customer') return user;

  const updates = {};
  if (phone && isValidMnPhone(phone)) {
    updates.phone = formatPhone(phone);
  }
  const address = deliveryAddress != null ? String(deliveryAddress).trim() : '';
  if (address.length >= 10) {
    updates.deliveryAddress = address;
  }

  if (Object.keys(updates).length === 0) return user;
  await user.update(updates);
  return user;
}
