import { Router } from 'express';
import { Order, OrderItem, Restaurant, User } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import {
  completeTracking,
  createInitialTracking,
  ensureTracking,
  setTrackingStep,
} from '../utils/orderTracking.js';
import {
  formatScheduledLabel,
  parsePreOrderFields,
  validateFulfillmentType,
  validatePreOrder,
} from '../utils/preOrder.js';
import { serializeOrder } from '../utils/serializers.js';
import { canWatchOrder, getCourierLocation } from '../services/driverLocation.js';

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

function courierTrackingPayload(courier) {
  return {
    name: courier.name,
    phone: courier.phone,
    rating: 4.9,
    vehicle: 'Хүргэлтийн машин',
    plateNumber: '',
    deliveryCount: courier.orderCount || 0,
    avatarUrl:
      courier.avatarUrl ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    distanceKm: 1.2,
  };
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('976') && digits.length === 11) return digits.slice(3);
  return digits;
}

function validateMnPhone(phone) {
  const digits = normalizePhone(phone);
  return /^[6-9]\d{7}$/.test(digits);
}

function validateAddress(address) {
  return typeof address === 'string' && address.trim().length >= 10;
}

function formatDateLabel() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `Өнөөдөр ${h}:${m}`;
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (req.user?.role !== 'admin') {
      where.userId = req.userId;
    }

    const orders = await Order.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
    });
    res.json(orders.map(serializeOrder));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { restaurantId, items, phone, deliveryAddress } = req.body;
    const preOrder = parsePreOrderFields(req.body);

    if (!restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Ресторан болон бүтээгдэхүүн шаардлагатай' });
    }
    if (!validateMnPhone(phone)) {
      return res.status(400).json({ error: 'Монгол утасны дугаар буруу (8 орон, 6-9-өөр эхэлнэ)' });
    }
    if (preOrder.isPreOrder && !validateFulfillmentType(preOrder.fulfillmentType)) {
      return res.status(400).json({ error: 'Хүргэлт эсвэл очиж авах сонголт буруу байна' });
    }
    const preOrderError = validatePreOrder(preOrder);
    if (preOrderError) {
      return res.status(400).json({ error: preOrderError });
    }
    const needsAddress =
      !preOrder.isPreOrder || preOrder.fulfillmentType === 'delivery';
    if (needsAddress && !validateAddress(deliveryAddress)) {
      return res.status(400).json({ error: 'Хүргэлтийн хаяг хэт богино байна (дор хаяж 10 тэмдэгт)' });
    }

    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Ресторан олдсонгүй' });

    const user = await User.findByPk(req.userId);
    if (user) {
      await user.update({
        phone: phone.includes('+976') ? phone : `+976 ${normalizePhone(phone).slice(0, 4)}-${normalizePhone(phone).slice(4)}`,
        deliveryAddress: deliveryAddress.trim(),
      });
    }

    const total = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0,
    );
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const resolvedAddress =
      preOrder.fulfillmentType === 'pickup'
        ? `Очиж авах · ${restaurant.name}`
        : deliveryAddress.trim();

    const dateLabel = preOrder.isPreOrder
      ? formatScheduledLabel(preOrder.scheduledDate, preOrder.scheduledTime) || formatDateLabel()
      : formatDateLabel();

    const order = await Order.create({
      orderNumber,
      userId: req.userId,
      restaurantId,
      status: 'active',
      total,
      deliveryAddress: resolvedAddress,
      dateLabel,
      fulfillmentType: preOrder.fulfillmentType,
      scheduledDate: preOrder.isPreOrder ? preOrder.scheduledDate : null,
      scheduledTime: preOrder.isPreOrder ? preOrder.scheduledTime : null,
      isPreOrder: preOrder.isPreOrder,
      estimatedMinutes: 30,
      tracking: createInitialTracking(orderNumber, restaurant.name, resolvedAddress),
    });

    await OrderItem.bulkCreate(
      items.map((item) => ({
        orderId: order.id,
        name: item.name,
        quantity: item.quantity || 1,
        price: item.price,
      })),
    );

    if (user) {
      await user.increment('orderCount');
      await user.increment('points', { by: Math.floor(total / 1000) });
    }

    const full = await Order.findByPk(order.id, { include });
    res.status(201).json(serializeOrder(full));
  } catch (err) {
    next(err);
  }
});

router.get('/:id/driver-location', requireAuth, async (req, res, next) => {
  try {
    const order = await canWatchOrder(req.user, req.params.id);
    if (!order) {
      return res.status(403).json({ error: 'Жолоочийн байршил харах боломжгүй' });
    }
    const location = await getCourierLocation(order.courierId);
    if (!location) {
      return res.json({ lat: null, lng: null, updatedAt: null });
    }
    res.json(location);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, { include });
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (req.user?.role === 'courier' && order.courierId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user?.role !== 'admin' && req.user?.role !== 'courier' && order.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(serializeOrder(order));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/courier', requireAuth, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Зөвхөн админ жолооч хуваарилна' });
    }

    const courierId = Number(req.body.courierId);
    if (!courierId) {
      return res.status(400).json({ error: 'Жолооч сонгоно уу' });
    }

    const order = await Order.findByPk(req.params.id, { include });
    if (!order) return res.status(404).json({ error: 'Захиалга олдсонгүй' });
    if (order.status !== 'active') {
      return res.status(400).json({ error: 'Дууссан захиалгад жолооч хуваарилахгүй' });
    }

    const courier = await User.findOne({
      where: { id: courierId, role: 'courier', isActive: true },
    });
    if (!courier) return res.status(404).json({ error: 'Жолооч олдсонгүй' });

    const tracking = ensureTracking(order);
    tracking.courier = courierTrackingPayload(courier);

    await order.update({
      courierId: courier.id,
      tracking,
    });

    const refreshed = await Order.findByPk(order.id, { include });
    res.json(serializeOrder(refreshed));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Зөвхөн админ статус өөрчилнө' });
    }

    const order = await Order.findByPk(req.params.id, { include });
    if (!order) return res.status(404).json({ error: 'Not found' });

    const { status, action } = req.body;
    const updates = {};
    const tracking = ensureTracking(order);

    if (action === 'preparing') {
      updates.tracking = setTrackingStep(tracking, 1);
      updates.status = 'active';
    } else if (action === 'out_for_delivery') {
      updates.tracking = setTrackingStep(tracking, 2);
      updates.status = 'active';
    } else if (action === 'delivered' || status === 'delivered') {
      updates.tracking = completeTracking(tracking);
      updates.status = 'delivered';
    } else if (action === 'cancelled' || status === 'cancelled') {
      updates.status = 'cancelled';
    } else if (status) {
      updates.status = status;
    } else {
      return res.status(400).json({ error: 'status эсвэл action шаардлагатай' });
    }

    await order.update(updates);
    const refreshed = await Order.findByPk(order.id, { include });
    res.json(serializeOrder(refreshed));
  } catch (err) {
    next(err);
  }
});

export default router;
