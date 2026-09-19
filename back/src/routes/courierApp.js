import { Router } from 'express';
import { Op } from 'sequelize';
import { Order, OrderItem, Restaurant, User } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { completeTracking, ensureTracking } from '../utils/orderTracking.js';
import { serializeOrder } from '../utils/serializers.js';

const router = Router();

const include = [
  { model: Restaurant, as: 'restaurant' },
  { model: OrderItem, as: 'items' },
  {
    model: User,
    as: 'courier',
    attributes: ['id', 'name', 'phone', 'avatarUrl', 'orderCount'],
  },
];

function requireCourier(req, res, next) {
  if (req.user?.role !== 'courier') {
    return res.status(403).json({ error: 'Зөвхөн жолооч хандах боломжтой' });
  }
  next();
}

router.get('/orders', requireAuth, requireCourier, async (req, res, next) => {
  try {
    const scope = req.query.scope === 'done' ? 'done' : 'active';
    const where = { courierId: req.userId };

    if (scope === 'done') {
      where.status = { [Op.in]: ['delivered', 'cancelled'] };
    } else {
      where.status = 'active';
    }

    const orders = await Order.findAll({
      where,
      include,
      order: [['updatedAt', 'DESC']],
    });

    res.json(orders.map(serializeOrder));
  } catch (err) {
    next(err);
  }
});

router.patch('/orders/:id', requireAuth, requireCourier, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, { include });
    if (!order) return res.status(404).json({ error: 'Захиалга олдсонгүй' });
    if (order.courierId !== req.userId) {
      return res.status(403).json({ error: 'Энэ захиалга танд хуваарилаагүй байна' });
    }
    if (order.status !== 'active') {
      return res.status(400).json({ error: 'Захиалга аль хэдийн дууссан байна' });
    }

    const action = req.body.action;
    const updates = {};

    if (action === 'delivered') {
      updates.tracking = completeTracking(ensureTracking(order));
      updates.status = 'delivered';
    } else if (action === 'declined') {
      updates.status = 'cancelled';
    } else {
      return res.status(400).json({ error: 'action: delivered эсвэл declined шаардлагатай' });
    }

    await order.update(updates);

    const courier = await User.findByPk(req.userId);
    if (courier && action === 'delivered') {
      await courier.increment('orderCount');
    }

    const refreshed = await Order.findByPk(order.id, { include });
    res.json(serializeOrder(refreshed));
  } catch (err) {
    next(err);
  }
});

export default router;
