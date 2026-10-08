import crypto from 'node:crypto';
import sequelize from '../config/database.js';
import { User, ReferralClick, UserReferral } from '../models/index.js';
import {
  buildReferralUrl,
  generateReferralCode,
  isValidReferralCodeFormat,
  normalizeReferralCode,
} from '../utils/referralCode.js';

const CLAIM_MAX_AGE_MS =
  Number(process.env.REFERRAL_CLAIM_MAX_AGE_HOURS || 72) * 60 * 60 * 1000;
const INVITER_REWARD_POINTS = Number(process.env.REFERRAL_INVITER_POINTS || 500);

export async function ensureUserReferralCode(user) {
  if (user.referralCode) {
    return user.referralCode;
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateReferralCode(8);
    try {
      await user.update({ referralCode: code });
      return code;
    } catch (err) {
      if (err.name !== 'SequelizeUniqueConstraintError') {
        throw err;
      }
    }
  }
  throw new Error('Referral code generation failed');
}

export async function findInviterByCode(code) {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCodeFormat(normalized)) {
    return null;
  }
  return User.findOne({
    where: { referralCode: normalized, isActive: true, role: 'customer' },
    attributes: ['id', 'referralCode', 'name'],
  });
}

export function hashClientIp(ip) {
  if (!ip) return null;
  const salt = process.env.REFERRAL_IP_SALT || 'foody-referral';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

export async function recordReferralClick({ code, ip, userAgent, existingClickId }) {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCodeFormat(normalized)) {
    const err = new Error('Урилгын код буруу байна');
    err.statusCode = 400;
    throw err;
  }

  const inviter = await findInviterByCode(normalized);
  if (!inviter) {
    const err = new Error('Урилгын код олдсонгүй');
    err.statusCode = 404;
    throw err;
  }

  if (existingClickId) {
    const prior = await ReferralClick.findByPk(existingClickId);
    if (
      prior &&
      prior.referralCode === normalized &&
      prior.inviterUserId === inviter.id
    ) {
      return { clickId: prior.clickId, referralCode: normalized, valid: true };
    }
  }

  const ipHash = hashClientIp(ip);
  if (ipHash) {
    const recent = await ReferralClick.findOne({
      where: { referralCode: normalized, ipHash },
      order: [['createdAt', 'DESC']],
    });
    if (recent && Date.now() - new Date(recent.createdAt).getTime() < 60 * 60 * 1000) {
      return { clickId: recent.clickId, referralCode: normalized, valid: true };
    }
  }

  const click = await ReferralClick.create({
    referralCode: normalized,
    inviterUserId: inviter.id,
    ipHash,
    userAgent: userAgent ? String(userAgent).slice(0, 512) : null,
  });

  return { clickId: click.clickId, referralCode: normalized, valid: true };
}

export async function getPublicReferralInfo(code) {
  const inviter = await findInviterByCode(code);
  if (!inviter) {
    const err = new Error('Урилгын код олдсонгүй');
    err.statusCode = 404;
    throw err;
  }
  return {
    valid: true,
    referralCode: inviter.referralCode,
    appName: 'Foody',
    inviteMessage: 'Найз таныг Foody апп руу урьж байна',
  };
}

export async function getReferralStatsForUser(userId) {
  const [pending, completed] = await Promise.all([
    UserReferral.count({ where: { inviterUserId: userId, status: 'registered' } }),
    UserReferral.count({ where: { inviterUserId: userId, status: 'completed' } }),
  ]);
  return {
    invitedRegistered: pending + completed,
    invitedCompleted: completed,
    invitedPendingPhoneVerify: pending,
  };
}

/** Awards inviter points once the invitee's phone is verified. */
export async function completeReferralRewardForInvitee(inviteeUserId) {
  return sequelize.transaction(async (transaction) => {
    const invitee = await User.findByPk(inviteeUserId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!invitee?.phoneVerifiedAt || !invitee.invitedByUserId) {
      return null;
    }

    const referral = await UserReferral.findOne({
      where: {
        inviteeUserId: invitee.id,
        inviterUserId: invitee.invitedByUserId,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!referral || referral.status === 'completed') {
      return null;
    }

    const inviter = await User.findByPk(invitee.invitedByUserId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!inviter) return null;

    await referral.update(
      { status: 'completed', completedAt: new Date() },
      { transaction },
    );
    await inviter.update(
      { points: (inviter.points || 0) + INVITER_REWARD_POINTS },
      { transaction },
    );

    return {
      inviterUserId: inviter.id,
      pointsAwarded: INVITER_REWARD_POINTS,
    };
  });
}

function assertClaimEligible(invitee) {
  if (!invitee || invitee.role !== 'customer') {
    const err = new Error('Зөвхөн хэрэглэгч урилга хүлээн авах боломжтой');
    err.statusCode = 403;
    throw err;
  }
  if (invitee.invitedByUserId) {
    const err = new Error('Та аль хэдийн урилга ашигласан байна');
    err.statusCode = 409;
    throw err;
  }
  const ageMs = Date.now() - new Date(invitee.createdAt).getTime();
  if (ageMs > CLAIM_MAX_AGE_MS) {
    const err = new Error('Шинэ бүртгэлд л урилга хэрэглэх боломжтой');
    err.statusCode = 403;
    throw err;
  }
}

export async function claimReferralForUser({ inviteeUserId, referralCode, clickId }) {
  const normalized = normalizeReferralCode(referralCode);
  if (!isValidReferralCodeFormat(normalized)) {
    const err = new Error('Урилгын код буруу байна');
    err.statusCode = 400;
    throw err;
  }

  return sequelize.transaction(async (transaction) => {
    const invitee = await User.findByPk(inviteeUserId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    assertClaimEligible(invitee);

    const inviter = await User.findOne({
      where: { referralCode: normalized, isActive: true, role: 'customer' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!inviter) {
      const err = new Error('Урилгын код олдсонгүй');
      err.statusCode = 404;
      throw err;
    }
    if (inviter.id === invitee.id) {
      const err = new Error('Өөрийгөө урих боломжгүй');
      err.statusCode = 400;
      throw err;
    }

    const existing = await UserReferral.findOne({
      where: { inviteeUserId: invitee.id },
      transaction,
    });
    if (existing) {
      const err = new Error('Урилга аль хэдийн бүртгэгдсэн');
      err.statusCode = 409;
      throw err;
    }

    let resolvedClickId = null;
    if (clickId) {
      const click = await ReferralClick.findByPk(clickId, { transaction });
      if (
        click &&
        click.referralCode === normalized &&
        click.inviterUserId === inviter.id
      ) {
        resolvedClickId = click.clickId;
      }
    }

    await UserReferral.create(
      {
        inviterUserId: inviter.id,
        inviteeUserId: invitee.id,
        clickId: resolvedClickId,
        status: 'registered',
        registeredAt: new Date(),
      },
      { transaction },
    );

    await invitee.update({ invitedByUserId: inviter.id }, { transaction });

    return {
      ok: true,
      inviterUserId: inviter.id,
      referralCode: normalized,
      clickId: resolvedClickId,
    };
  }).then(async (result) => {
    const reward = await completeReferralRewardForInvitee(inviteeUserId);
    return {
      ...result,
      referralCompleted: Boolean(reward),
      pointsAwardedToInviter: reward?.pointsAwarded ?? 0,
    };
  });
}

export async function getMeReferralPayload(user) {
  const code = await ensureUserReferralCode(user);
  const stats = await getReferralStatsForUser(user.id);
  return {
    referralCode: code,
    referralUrl: buildReferralUrl(code),
    stats,
  };
}
