import { Router } from 'express';
import { Op } from 'sequelize';
import { User } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  isPushConfigured,
  sendToTokens,
} from '../services/pushNotification.js';

const router = Router();

router.get('/status', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const registeredDevices = await User.count({
      where: {
        fcmToken: { [Op.ne]: null },
        role: 'customer',
        isActive: true,
      },
    });

    res.json({
      configured: isPushConfigured(),
      registeredDevices,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/send', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!isPushConfigured()) {
      return res.status(503).json({
        error: 'FCM тохируулаагүй байна. FIREBASE_SERVICE_ACCOUNT_JSON эсвэл FIREBASE_SERVICE_ACCOUNT_PATH тохируулна уу.',
      });
    }

    const title = String(req.body.title || '').trim();
    const body = String(req.body.body || '').trim();
    const target = req.body.target === 'user' ? 'user' : 'all';
    const type = String(req.body.type || 'system');
    const userId = req.body.userId != null ? Number(req.body.userId) : null;

    if (!title || !body) {
      return res.status(400).json({ error: 'Гарчиг болон агуулга шаардлагатай' });
    }

    if (target === 'user' && !userId) {
      return res.status(400).json({ error: 'Хэрэглэгч сонгоно уу' });
    }

    const where = {
      fcmToken: { [Op.ne]: null },
      isActive: true,
      role: 'customer',
    };
    if (target === 'user') {
      where.id = userId;
    }

    const users = await User.findAll({ where, attributes: ['id', 'fcmToken'] });
    const tokens = users.map((u) => u.fcmToken).filter(Boolean);

    if (tokens.length === 0) {
      return res.status(404).json({
        error: 'Бүртгэлтэй төхөөрөмж олдсонгүй. Аpp-д нэвтэрч push зөвшөөрөл өгсөн эсэхийг шалгана уу.',
      });
    }

    const result = await sendToTokens(tokens, {
      title,
      body,
      data: { type, target: String(target) },
    });

    res.json({
      ok: true,
      target,
      userId: target === 'user' ? userId : null,
      attempted: tokens.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
