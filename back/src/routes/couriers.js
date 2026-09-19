import { Router } from 'express';
import { Op } from 'sequelize';
import { User } from '../models/index.js';
import { serializeUser } from '../utils/serializers.js';
import { hashPassword } from '../utils/password.js';

const router = Router();

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('976') && digits.length === 11) return digits.slice(3);
  return digits;
}

function formatPhone(phone) {
  const digits = normalizePhone(phone);
  if (digits.length === 8) return `+976 ${digits.slice(0, 4)}-${digits.slice(4)}`;
  return String(phone || '').trim();
}

function courierEmail(phone) {
  return `courier-${normalizePhone(phone)}@foody.internal`;
}

router.get('/', async (_req, res, next) => {
  try {
    const couriers = await User.findAll({
      where: { role: 'courier' },
      order: [['created_at', 'DESC']],
    });
    res.json(couriers.map(serializeUser));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const phone = formatPhone(req.body.phone);
    const password = String(req.body.password || '');

    if (!name || !normalizePhone(phone)) {
      return res.status(400).json({ error: 'Нэр, утас шаардлагатай' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Нууц үг дор хаяж 4 тэмдэгт байна' });
    }

    const existing = await User.findOne({
      where: {
        [Op.or]: [{ phone }, { email: courierEmail(phone) }],
      },
    });
    if (existing) {
      return res.status(409).json({ error: 'Энэ утсаар жолооч бүртгэгдсэн байна' });
    }

    const courier = await User.create({
      name,
      phone,
      email: courierEmail(phone),
      role: 'courier',
      passwordHash: hashPassword(password),
      membershipLevel: 'Driver',
      isActive: req.body.isActive !== false,
    });

    res.status(201).json(serializeUser(courier));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const courier = await User.findOne({
      where: { id: req.params.id, role: 'courier' },
    });
    if (!courier) return res.status(404).json({ error: 'Жолооч олдсонгүй' });

    const updates = {};
    if (req.body.name) updates.name = String(req.body.name).trim();
    if (req.body.phone) {
      const phone = formatPhone(req.body.phone);
      updates.phone = phone;
      updates.email = courierEmail(phone);
    }
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);

    const password = String(req.body.password || '');
    if (password) {
      if (password.length < 4) {
        return res.status(400).json({ error: 'Нууц үг дор хаяж 4 тэмдэгт байна' });
      }
      updates.passwordHash = hashPassword(password);
    }

    await courier.update(updates);
    res.json(serializeUser(courier));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const courier = await User.findOne({
      where: { id: req.params.id, role: 'courier' },
    });
    if (!courier) return res.status(404).json({ error: 'Жолооч олдсонгүй' });
    await courier.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
