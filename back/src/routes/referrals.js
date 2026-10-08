import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { referralRateLimit } from '../middleware/referralRateLimit.js';
import { User } from '../models/index.js';
import {
  claimReferralForUser,
  getMeReferralPayload,
  getPublicReferralInfo,
  recordReferralClick,
} from '../services/referralService.js';
import { normalizeReferralCode } from '../utils/referralCode.js';

const router = Router();
const publicLimit = referralRateLimit({ windowMs: 60_000, max: 80 });

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}

function sendServiceError(res, err) {
  const status = err.statusCode || 500;
  return res.status(status).json({ error: err.message || 'Алдаа гарлаа' });
}

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    if (req.user?.role !== 'customer') {
      return res.status(403).json({ error: 'Зөвхөн хэрэглэгчид урилга ашиглана' });
    }
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    const payload = await getMeReferralPayload(user);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.post('/click', publicLimit, async (req, res, next) => {
  try {
    const code = normalizeReferralCode(req.body.referralCode || req.body.code);
    const existingClickId = req.body.clickId || req.body.click_id || null;
    const result = await recordReferralClick({
      code,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
      existingClickId,
    });
    res.json(result);
  } catch (err) {
    sendServiceError(res, err);
  }
});

router.get('/:code', publicLimit, async (req, res, next) => {
  try {
    const code = normalizeReferralCode(req.params.code);
    const info = await getPublicReferralInfo(code);
    res.json(info);
  } catch (err) {
    sendServiceError(res, err);
  }
});

router.post('/claim', requireAuth, async (req, res, next) => {
  try {
    if (req.user?.role !== 'customer') {
      return res.status(403).json({ error: 'Зөвхөн хэрэглэгчид урилга хүлээн авах боломжтой' });
    }
    const referralCode = normalizeReferralCode(req.body.referralCode || req.body.code);
    const clickId = req.body.clickId || req.body.click_id || null;
    const result = await claimReferralForUser({
      inviteeUserId: req.userId,
      referralCode,
      clickId,
    });
    res.json(result);
  } catch (err) {
    sendServiceError(res, err);
  }
});

export default router;
