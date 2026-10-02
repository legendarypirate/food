import { User } from '../models/index.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

export const REVIEW_LOGIN = {
  email: 'testuser@gmail.com',
  password: '123456',
  name: 'Play Store Reviewer',
  phone: '+976 99001100',
};

export async function ensureReviewUser() {
  const email = REVIEW_LOGIN.email.toLowerCase();
  const existing = await User.findOne({ where: { email } });
  const passwordOk =
    existing?.passwordHash &&
    verifyPassword(REVIEW_LOGIN.password, existing.passwordHash);

  if (existing && passwordOk && existing.isActive) {
    console.log(`Play Store review user ready: ${email}`);
    return existing;
  }

  const passwordHash = hashPassword(REVIEW_LOGIN.password);
  if (existing) {
    await existing.update({
      passwordHash,
      isActive: true,
      role: 'customer',
    });
    console.log(`Play Store review user updated: ${email}`);
    return existing;
  }

  const user = await User.create({
    name: REVIEW_LOGIN.name,
    phone: REVIEW_LOGIN.phone,
    email,
    role: 'customer',
    membershipLevel: 'Gold',
    points: 100,
    orderCount: 0,
    deliveryAddress: 'Самбуугийн гудамж 48, УБ',
    isActive: true,
    passwordHash,
  });
  console.log(`Play Store review user created: ${email}`);
  return user;
}
