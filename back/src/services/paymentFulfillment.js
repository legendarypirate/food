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
import { formatPhone, isValidMnPhone } from '../utils/phone.js';
import { markPayerRequestPaid } from './paymentDelegation.js';
import { syncUserCheckoutContact } from './userContact.js';
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

async function awardCheckoutRewards(userId, { phone, deliveryAddress, total }) {
  if (!userId) return;
  const user = await User.findByPk(userId);
  if (!user) return;
  await syncUserCheckoutContact(user, { phone, deliveryAddress });
  await user.increment('orderCount');
  await user.increment('points', { by: Math.floor(total / 1000) });
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
  status = 'active',
  awardRewards,
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
  const formattedPhone =
    phone && isValidMnPhone(phone) ? formatPhone(phone) : null;

  const order = await Order.create({
    orderNumber: number,
    userId: userId || null,
    restaurantId,
    status,
    total,
    deliveryAddress: resolvedAddress,
    contactPhone: formattedPhone,
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

  const shouldAward = awardRewards ?? status === 'active';
  if (shouldAward) {
    await awardCheckoutRewards(userId, { phone, deliveryAddress, total });
  } else if (userId) {
    const user = await User.findByPk(userId);
    if (user) {
      await syncUserCheckoutContact(user, { phone, deliveryAddress });
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
  let order;

  if (payment.orderId) {
    const existing = await Order.findByPk(payment.orderId, { include });
    if (existing) {
      if (existing.status === 'pending_payment' || existing.status === 'cancelled') {
        await existing.update({ status: 'active' });
        await awardCheckoutRewards(existing.userId, {
          phone: metadata.phone,
          deliveryAddress: metadata.deliveryAddress,
          total: existing.total,
        });
      }
      order = serializeOrder(await Order.findByPk(existing.id, { include }));
    }
  }

  if (!order) {
    order = await createOrderFromCheckout({
      ...metadata,
      orderNumber: payment.senderInvoiceNo,
      expectedAmount: payment.amount,
    });
  }

  await payment.update({
    status: 'paid',
    orderId: order.id,
    paidAt: new Date(),
    qrText: wireStatus || payment.qrText,
  });

  try {
    await markPayerRequestPaid(payment, order);
  } catch (err) {
    console.warn('Payment delegation: failed to mark request paid:', err.message);
  }

  return { payment, order };
}

export async function cancelUnpaidDelegatedOrder(payment) {
  if (!payment.orderId) return;
  const order = await Order.findByPk(payment.orderId);
  if (order && order.status === 'pending_payment') {
    await order.update({ status: 'cancelled' });
  }
}

/** Create (or revive) an unpaid order so the requester sees "төлбөр хүлээгдэж байна". */
export async function ensurePendingDelegatedOrder(payment) {
  if (payment.orderId) {
    const existing = await Order.findByPk(payment.orderId);
    if (existing && existing.status === 'cancelled') {
      await existing.update({ status: 'pending_payment' });
    }
    return payment;
  }

  const metadata = payment.metadata || {};
  const order = await createOrderFromCheckout({
    ...metadata,
    orderNumber: payment.senderInvoiceNo,
    expectedAmount: payment.amount,
    status: 'pending_payment',
    awardRewards: false,
  });
  await payment.update({ orderId: Number(order.id) });
  return payment;
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
    await cancelUnpaidDelegatedOrder(payment);
    return { status: 'cancelled', order: null };
  }

  if (wireStatus === 'expired') {
    await payment.update({ status: 'expired' });
    await cancelUnpaidDelegatedOrder(payment);
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
