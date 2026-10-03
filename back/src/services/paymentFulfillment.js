import {
  Order,
  OrderItem,
  QPayPayment,
  Restaurant,
  User,
} from '../models/index.js';
import { createInitialTracking } from '../utils/orderTracking.js';
import { formatScheduledLabel } from '../utils/preOrder.js';
import { serializeOrder } from '../utils/serializers.js';
import { formatUbDateLabel } from '../utils/ulaanbaatarTime.js';
import { retrievePaymentIntent } from './wireService.js';

const include = [
  { model: Restaurant, as: 'restaurant' },
  { model: OrderItem, as: 'items' },
  {
    model: User,
    as: 'courier',
    attributes: ['id', 'name', 'phone', 'avatarUrl', 'orderCount'],
  },
];

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('976') && digits.length === 11) return digits.slice(3);
  return digits;
}

function formatPhoneForProfile(phone) {
  const digits = normalizePhone(phone);
  return `+976 ${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export async function createOrderFromCheckout({
  restaurantId,
  items,
  phone,
  deliveryAddress,
  userId,
  fulfillmentType = 'delivery',
  scheduledDate,
  scheduledTime,
  isPreOrder = false,
  orderNumber,
  expectedAmount,
}) {
  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    throw new Error('Захиалгын мэдээлэл дутуу байна');
  }

  const restaurant = await Restaurant.findByPk(restaurantId);
  if (!restaurant) {
    throw new Error('Ресторан олдсонгүй');
  }

  const total = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0,
  );

  if (expectedAmount != null && total !== expectedAmount) {
    throw new Error('Төлбөрийн дүн захиалгын дүнтэй таарахгүй байна');
  }

  const resolvedAddress =
    fulfillmentType === 'pickup'
      ? `Очиж авах · ${restaurant.name}`
      : String(deliveryAddress || '').trim();

  const dateLabel = isPreOrder
    ? formatScheduledLabel(scheduledDate, scheduledTime) || formatUbDateLabel()
    : formatUbDateLabel();

  const number = orderNumber || `ORD-${Date.now().toString().slice(-8)}`;
  const order = await Order.create({
    orderNumber: number,
    userId: userId || null,
    restaurantId,
    status: 'active',
    total,
    deliveryAddress: resolvedAddress,
    dateLabel,
    fulfillmentType,
    scheduledDate: isPreOrder ? scheduledDate : null,
    scheduledTime: isPreOrder ? scheduledTime : null,
    isPreOrder: Boolean(isPreOrder),
    estimatedMinutes: 30,
    tracking: createInitialTracking(number, restaurant.name, resolvedAddress),
  });

  await OrderItem.bulkCreate(
    items.map((item) => ({
      orderId: order.id,
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price,
    })),
  );

  if (userId) {
    const user = await User.findByPk(userId);
    if (user) {
      if (phone) {
        await user.update({
          phone: formatPhoneForProfile(phone),
          deliveryAddress: String(deliveryAddress || '').trim(),
        });
      }
      await user.increment('orderCount');
      await user.increment('points', { by: Math.floor(total / 1000) });
    }
  }

  const full = await Order.findByPk(order.id, { include });
  return serializeOrder(full);
}

export async function fulfillPayment(payment, { wireStatus } = {}) {
  if (payment.status === 'paid' && payment.orderId) {
    const existing = await Order.findByPk(payment.orderId, { include });
    return { payment, order: existing ? serializeOrder(existing) : null };
  }

  const metadata = payment.metadata || {};
  const order = await createOrderFromCheckout({
    ...metadata,
    orderNumber: payment.senderInvoiceNo,
    expectedAmount: payment.amount,
  });

  await payment.update({
    status: 'paid',
    orderId: order.id,
    paidAt: new Date(),
    qrText: wireStatus || payment.qrText,
  });

  return { payment, order };
}

export async function syncPaymentStatus(payment) {
  if (payment.status === 'paid') {
    const order = payment.orderId
      ? await Order.findByPk(payment.orderId, { include })
      : null;
    return {
      status: 'paid',
      order: order ? serializeOrder(order) : null,
    };
  }

  const wireIntent = await retrievePaymentIntent(payment.invoiceId);
  const wireStatus = wireIntent.status;

  if (wireStatus === 'succeeded') {
    const result = await fulfillPayment(payment, { wireStatus });
    return {
      status: 'paid',
      order: result.order,
    };
  }

  if (wireStatus === 'canceled' || wireStatus === 'cancelled') {
    await payment.update({ status: 'cancelled' });
    return { status: 'cancelled', order: null };
  }

  if (wireStatus === 'expired') {
    await payment.update({ status: 'expired' });
    return { status: 'expired', order: null };
  }

  return { status: 'pending', order: null };
}

export async function handleWirePaymentSucceeded(paymentIntentId) {
  const payment = await QPayPayment.findOne({ where: { invoiceId: paymentIntentId } });
  if (!payment) {
    return null;
  }

  const wireIntent = await retrievePaymentIntent(paymentIntentId);
  if (wireIntent.status !== 'succeeded') {
    return null;
  }

  const result = await fulfillPayment(payment, { wireStatus: wireIntent.status });
  return result;
}
