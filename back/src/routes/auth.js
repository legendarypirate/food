import { Router } from 'express';
import { User } from '../models/index.js';
import { issueToken, requireAuth, revokeToken } from '../middleware/auth.js';
import { serializeUser } from '../utils/serializers.js';
import { verifyPassword } from '../utils/password.js';

const router = Router();

const DEMO_ADMIN = {
  phone: '99001122',
  password: 'admin123',
};

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('976') && digits.length === 11) return digits.slice(3);
  return digits;
}

function formatPhone(phone) {
  const digits = normalizePhone(phone);
  if (digits.length === 8) return `+976 ${digits.slice(0, 4)}-${digits.slice(4)}`;
  return phone;
}

router.post('/login', async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || '');

    const demoPhone = normalizePhone(DEMO_ADMIN.phone);
    if (phone === demoPhone && password === DEMO_ADMIN.password) {
      return res.json({
        ok: true,
        token: 'demo-admin-token',
        user: { id: 1, name: 'Админ', phone: '99001122', role: 'admin' },
      });
    }

    const couriers = await User.findAll({
      where: { role: 'courier', isActive: true },
    });
    const courier = couriers.find((c) => normalizePhone(c.phone) === phone);
    if (courier?.passwordHash && verifyPassword(password, courier.passwordHash)) {
      const token = issueToken(courier.id);
      return res.json({ ok: true, token, user: serializeUser(courier) });
    }

    res.status(401).json({ error: 'Утас эсвэл нууц үг буруу байна' });
  } catch (err) {
    next(err);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    const { googleId, email, name, avatarUrl } = req.body;
    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google мэдээлэл дутуу байна' });
    }

    let user = await User.findOne({ where: { googleId } });
    if (!user) {
      user = await User.findOne({ where: { email } });
    }
    if (user) {
      await user.update({
        googleId,
        name: name || user.name,
        avatarUrl: avatarUrl || user.avatarUrl,
      });
    } else {
      user = await User.create({
        googleId,
        email,
        name: name || 'Хэрэглэгч',
        phone: '',
        avatarUrl: avatarUrl || null,
        role: 'customer',
      });
    }

    const token = issueToken(user.id);
    res.json({ ok: true, token, user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    if (req.user?.role === 'admin' && !req.user.email) {
      return res.json({
        id: 1,
        name: 'Админ',
        phone: '99001122',
        email: 'admin@foody.mn',
        role: 'admin',
        membershipLevel: 'Admin',
        points: 0,
        orderCount: 0,
        avatarUrl: null,
        deliveryAddress: null,
        isActive: true,
      });
    }
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    res.json(serializeUser(user));
  } catch (err) {
    next(err);
  }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone) updates.phone = formatPhone(req.body.phone);
    if (req.body.deliveryAddress) updates.deliveryAddress = req.body.deliveryAddress.trim();
    if (req.body.fcmToken !== undefined) {
      updates.fcmToken = req.body.fcmToken ? String(req.body.fcmToken).trim() : null;
    }
    if (req.body.fcmPlatform !== undefined) {
      updates.fcmPlatform = req.body.fcmPlatform ? String(req.body.fcmPlatform).trim() : null;
    }

    await user.update(updates);
    res.json(serializeUser(user));
  } catch (err) {
    next(err);
  }
});

router.post('/fcm-token', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });

    const fcmToken = req.body.fcmToken ? String(req.body.fcmToken).trim() : null;
    const fcmPlatform = req.body.platform ? String(req.body.platform).trim() : null;

    await user.update({ fcmToken, fcmPlatform });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', requireAuth, (req, res) => {
  const token = (req.headers.authorization || '').slice(7);
  if (token && token !== 'demo-admin-token') revokeToken(token);
  res.json({ ok: true });
});

export default router;
