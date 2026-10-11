import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { Order, QPayPayment, Restaurant, User } from '../models/index.js';
import { formatPhone, isValidMnPhone, normalizePhone } from '../utils/phone.js';
import {
  cancelUnpaidDelegatedOrder,
  ensurePendingDelegatedOrder,
} from './paymentFulfillment.js';
import { isPushConfigured, sendToUser } from './pushNotification.js';

/** How long a payer can still see a request in their list (incl. resolved ones). */
const REQUEST_VISIBLE_DAYS = 7;

export class DelegationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function formatAmount(amount) {
  return `${Number(amount || 0).toLocaleString('en-US')}₮`;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user.id),
    name: user.name || '',
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || null,
  };
}

async function notify(user, payload) {
  if (!user || !isPushConfigured()) return;
  try {
    await sendToUser(user, payload);
  } catch (err) {
    console.warn('Payment delegation push failed:', err.message);
  }
}

/** Find an active customer whose phone matches the given Mongolian number. */
export async function findCustomerByPhone(phone) {
  const digits = normalizePhone(phone);
  if (digits.length !== 8) return null;

  const candidates = await User.findAll({
    where: {
      role: 'customer',
      isActive: true,
      [Op.and]: [
        sequelize.where(
          sequelize.fn('regexp_replace', sequelize.col('phone'), '\\D', '', 'g'),
          { [Op.in]: [digits, `976${digits}`] },
        ),
      ],
    },
    order: [
      ['phone_verified_at', 'DESC NULLS LAST'],
      ['id', 'ASC'],
    ],
  });

  return candidates[0] || null;
}

export function requesterIdOf(payment) {
  const raw = payment?.metadata?.userId;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function isRequester(payment, user) {
  return Boolean(user) && requesterIdOf(payment) === user.id;
}

export function isPayer(payment, user) {
  if (!user || !payment?.payerRequestStatus) return false;
  if (payment.payerUserId && payment.payerUserId === user.id) return true;
  const userDigits = normalizePhone(user.phone);
  const payerDigits = normalizePhone(payment.payerPhone);
  return userDigits.length === 8 && userDigits === payerDigits;
}

export function canViewPayment(payment, user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const requesterId = requesterIdOf(payment);
  if (!requesterId) return true; // legacy payment without owner
  return isRequester(payment, user) || isPayer(payment, user);
}

function checkoutUrlFor(payment, viewer) {
  if (!payment?.qpayShortUrl) return '';
  if (viewer?.role === 'admin') return payment.qpayShortUrl;
  if (viewer && isRequester(payment, viewer)) return payment.qpayShortUrl;
  if (
    payment.payerRequestStatus === 'accepted' &&
    viewer &&
    isPayer(payment, viewer)
  ) {
    return payment.qpayShortUrl;
  }
  return '';
}

async function loadRestaurant(payment) {
  const restaurantId = Number(payment?.metadata?.restaurantId);
  if (!restaurantId) return null;
  return Restaurant.findByPk(restaurantId, { attributes: ['id', 'name', 'imageUrl'] });
}

async function loadOrderNumber(payment) {
  if (payment.order?.orderNumber) return payment.order.orderNumber;
  if (!payment.orderId) return null;
  const order = await Order.findByPk(payment.orderId, { attributes: ['orderNumber'] });
  return order?.orderNumber || null;
}

export async function serializePaymentRequest(payment, { requester, payer, viewer } = {}) {
  const metadata = payment.metadata || {};
  const requesterUser =
    requester !== undefined
      ? requester
      : requesterIdOf(payment)
        ? await User.findByPk(requesterIdOf(payment))
        : null;
  const payerUser =
    payer !== undefined
      ? payer
      : payment.payerUserId
        ? await User.findByPk(payment.payerUserId)
        : null;
  const restaurant = await loadRestaurant(payment);
  const orderNumber = await loadOrderNumber(payment);

  return {
    id: payment.id,
    amount: payment.amount,
    status: payment.status,
    requestStatus: payment.payerRequestStatus,
    note: payment.payerNote || null,
    requestedAt: payment.payerRequestedAt,
    respondedAt: payment.payerRespondedAt,
    expiresAt: payment.expiresAt,
    checkoutUrl: checkoutUrlFor(payment, viewer),
    senderInvoiceNo: payment.senderInvoiceNo,
    orderId: payment.orderId ? String(payment.orderId) : null,
    orderNumber,
    requester: publicUser(requesterUser),
    payer: publicUser(payerUser),
    payerPhone: payment.payerPhone || null,
    payerRegistered: Boolean(payerUser),
    viewerRole: viewer
      ? isRequester(payment, viewer)
        ? 'requester'
        : isPayer(payment, viewer)
          ? 'payer'
          : 'other'
      : null,
    restaurant: restaurant
      ? { id: String(restaurant.id), name: restaurant.name, imageUrl: restaurant.imageUrl || '' }
      : null,
    items: Array.isArray(metadata.items)
      ? metadata.items.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        }))
      : [],
    deliveryAddress: metadata.deliveryAddress || '',
    fulfillmentType: metadata.fulfillmentType || 'delivery',
    isPreOrder: Boolean(metadata.isPreOrder),
    scheduledDate: metadata.scheduledDate || null,
    scheduledTime: metadata.scheduledTime || null,
    createdAt: payment.createdAt,
  };
}

/** Requester asks a friend (by phone) to pay this pending payment. */
export async function requestPayer(payment, { requester, phone, note }) {
  if (payment.status !== 'pending') {
    throw new DelegationError('Энэ төлбөр аль хэдийн шийдэгдсэн байна');
  }
  if (!isValidMnPhone(phone)) {
    throw new DelegationError('Найзын утасны дугаар буруу (8 орон, 6-9-өөр эхэлнэ)');
  }

  const digits = normalizePhone(phone);
  if (normalizePhone(requester.phone) === digits) {
    throw new DelegationError('Өөрийнхөө дугаарт хүсэлт илгээх боломжгүй');
  }

  const payer = await findCustomerByPhone(digits);
  if (!payer) {
    throw new DelegationError(
      'Энэ утастай хэрэглэгч Foody апп-д бүртгэлгүй байна',
      404,
    );
  }
  if (payer.id === requester.id) {
    throw new DelegationError('Өөрийнхөө дугаарт хүсэлт илгээх боломжгүй');
  }

  const trimmedNote = String(note || '').trim().slice(0, 200);

  await payment.update({
    payerUserId: payer.id,
    payerPhone: formatPhone(digits),
    payerNote: trimmedNote || null,
    payerRequestStatus: 'pending',
    payerRequestedAt: new Date(),
    payerRespondedAt: null,
  });

  await ensurePendingDelegatedOrder(payment);

  await notify(payer, {
    title: 'Төлбөрийн хүсэлт',
    body: `${requester.name || 'Найз'} таныг ${formatAmount(payment.amount)} захиалгын төлбөрийг төлөхийг хүсэж байна`,
    data: { type: 'payment_request', paymentId: String(payment.id) },
  });

  return serializePaymentRequest(payment, { requester, payer, viewer: requester });
}

/** Requester withdraws the request. */
export async function cancelPayerRequest(payment, { requester }) {
  if (!['pending', 'accepted'].includes(payment.payerRequestStatus)) {
    throw new DelegationError('Идэвхтэй хүсэлт байхгүй байна');
  }

  await payment.update({
    payerRequestStatus: 'cancelled',
    payerRespondedAt: new Date(),
  });
  await cancelUnpaidDelegatedOrder(payment);

  const payer = payment.payerUserId ? await User.findByPk(payment.payerUserId) : null;
  await notify(payer, {
    title: 'Төлбөрийн хүсэлт цуцлагдлаа',
    body: `${requester.name || 'Найз'} ${formatAmount(payment.amount)} төлбөрийн хүсэлтээ буцаалаа`,
    data: { type: 'payment_request_cancelled', paymentId: String(payment.id) },
  });

  return serializePaymentRequest(payment, { requester, payer, viewer: requester });
}

/** Payer declines to pay. */
export async function declinePayerRequest(payment, { payer }) {
  if (payment.payerRequestStatus !== 'pending') {
    throw new DelegationError('Энэ хүсэлт аль хэдийн шийдэгдсэн байна');
  }

  await payment.update({
    payerUserId: payment.payerUserId || payer.id,
    payerRequestStatus: 'declined',
    payerRespondedAt: new Date(),
  });
  await cancelUnpaidDelegatedOrder(payment);

  const requester = requesterIdOf(payment) ? await User.findByPk(requesterIdOf(payment)) : null;
  await notify(requester, {
    title: 'Төлбөрийн хүсэлт татгалзлаа',
    body: `${payer.name || 'Найз'} ${formatAmount(payment.amount)} төлбөрийг төлөхөөс татгалзлаа`,
    data: { type: 'payment_request_declined', paymentId: String(payment.id) },
  });

  return serializePaymentRequest(payment, { requester, payer, viewer: payer });
}

/**
 * Called from payment fulfillment: mark a pending friend request as paid and
 * tell the requester their order is confirmed.
 */
export async function lookupPayerByPhone(phone, { requester } = {}) {
  if (!isValidMnPhone(phone)) {
    throw new DelegationError('Найзын утасны дугаар буруу (8 орон, 6-9-өөр эхэлнэ)');
  }
  const digits = normalizePhone(phone);
  if (requester && normalizePhone(requester.phone) === digits) {
    throw new DelegationError('Өөрийнхөө дугаарт хүсэлт илгээх боломжгүй');
  }
  const payer = await findCustomerByPhone(digits);
  if (!payer || (requester && payer.id === requester.id)) {
    return { found: false };
  }
  return {
    found: true,
    name: payer.name || '',
    phone: formatPhone(digits),
  };
}

/** Payer accepts: then they may open Wire/QPay and pay. */
export async function acceptPayerRequest(payment, { payer }) {
  if (payment.status !== 'pending') {
    throw new DelegationError('Энэ төлбөр аль хэдийн шийдэгдсэн байна');
  }
  if (payment.payerRequestStatus === 'accepted') {
    return serializePaymentRequest(payment, { payer, viewer: payer });
  }
  if (payment.payerRequestStatus !== 'pending') {
    throw new DelegationError('Энэ хүсэлт аль хэдийн шийдэгдсэн байна');
  }

  await payment.update({
    payerUserId: payment.payerUserId || payer.id,
    payerRequestStatus: 'accepted',
    payerRespondedAt: new Date(),
  });

  const requester = requesterIdOf(payment) ? await User.findByPk(requesterIdOf(payment)) : null;
  await notify(requester, {
    title: 'Найз тань зөвшөөрлөө',
    body: `${payer.name || 'Найз'} ${formatAmount(payment.amount)} төлбөрийг төлөхөөр зөвшөөрлөө`,
    data: { type: 'payment_request_accepted', paymentId: String(payment.id) },
  });

  return serializePaymentRequest(payment, { requester, payer, viewer: payer });
}

export async function markPayerRequestPaid(payment, order) {
  if (!['pending', 'accepted'].includes(payment.payerRequestStatus)) return;

  await payment.update({
    payerRequestStatus: 'paid',
    payerRespondedAt: new Date(),
  });

  const requester = requesterIdOf(payment) ? await User.findByPk(requesterIdOf(payment)) : null;
  const payer = payment.payerUserId ? await User.findByPk(payment.payerUserId) : null;
  const payerLabel = payer?.name || payment.payerPhone || 'Найз';
  const orderLabel = order?.orderNumber ? ` Захиалга #${order.orderNumber}.` : '';

  await notify(requester, {
    title: 'Захиалгын төлбөр төлөгдлөө',
    body: `${payerLabel} таны ${formatAmount(payment.amount)} төлбөрийг төллөө.${orderLabel}`,
    data: {
      type: 'payment_request_paid',
      paymentId: String(payment.id),
      orderId: order?.id ? String(order.id) : null,
    },
  });
}

/** Requests addressed to this user (as payer), newest first. */
export async function listPayerRequests(user) {
  const since = new Date(Date.now() - REQUEST_VISIBLE_DAYS * 24 * 60 * 60 * 1000);
  const digits = normalizePhone(user.phone);
  const or = [{ payerUserId: user.id }];
  if (digits.length === 8) {
    or.push({ payerPhone: formatPhone(digits) });
  }

  const payments = await QPayPayment.findAll({
    where: {
      payerRequestStatus: { [Op.ne]: null },
      payerRequestedAt: { [Op.gte]: since },
      [Op.or]: or,
    },
    include: [{ model: Order, as: 'order', attributes: ['orderNumber'] }],
    order: [['payer_requested_at', 'DESC']],
  });

  // Attach requests that were sent to this phone before the user registered.
  for (const payment of payments) {
    if (!payment.payerUserId) {
      await payment.update({ payerUserId: user.id });
    }
  }

  const requesterIds = [...new Set(payments.map(requesterIdOf).filter(Boolean))];
  const requesters = requesterIds.length
    ? await User.findAll({ where: { id: { [Op.in]: requesterIds } } })
    : [];
  const byId = new Map(requesters.map((u) => [u.id, u]));

  return Promise.all(
    payments.map((payment) =>
      serializePaymentRequest(payment, {
        requester: byId.get(requesterIdOf(payment)) || null,
        payer: user,
        viewer: user,
      }),
    ),
  );
}
