import { Router } from 'express';
import { Order, QPayPayment } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeQPayPayment } from '../utils/serializers.js';
import { handleWirePaymentSucceeded, syncPaymentStatus } from '../services/paymentFulfillment.js';
import {
  createCheckoutSession,
  createPaymentIntent,
  getAllowedOperators,
  isWireConfigured,
  verifyWebhookSignature,
} from '../services/wireService.js';

const router = Router();

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

function makeReference() {
  return `ORD-${Date.now().toString().slice(-8)}`;
}

router.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    if (!isWireConfigured()) {
      return res.status(503).json({
        error: 'Төлбөрийн систем тохируулаагүй байна. WIRE_API_KEY нэмнэ үү.',
      });
    }

    const { restaurantId, items, phone, deliveryAddress, amount } = req.body;

    if (!restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Ресторан болон бүтээгдэхүүн шаардлагатай' });
    }
    if (!validateMnPhone(phone)) {
      return res.status(400).json({ error: 'Монгол утасны дугаар буруу (8 орон, 6-9-өөр эхэлнэ)' });
    }
    if (!validateAddress(deliveryAddress)) {
      return res.status(400).json({ error: 'Хүргэлтийн хаяг хэт богино байна (дор хаяж 10 тэмдэгт)' });
    }

    const computedTotal = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0,
    );
    const paymentAmount = Number(amount) || computedTotal;

    if (paymentAmount !== computedTotal || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Төлбөрийн дүн буруу байна' });
    }

    const allowedOperators = getAllowedOperators();
    if (allowedOperators.length === 0) {
      return res.status(503).json({
        error: 'WIRE_ALLOWED_OPERATORS тохируулаагүй байна (жишээ: sandbox эсвэл qpay)',
      });
    }

    const reference = makeReference();
    const description = `foodmn захиалга ${reference}`;

    const paymentIntent = await createPaymentIntent({
      amount: paymentAmount,
      description,
      reference,
      allowedOperators,
    });

    const session = await createCheckoutSession({
      paymentIntentId: paymentIntent.id,
      reference,
    });

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const payment = await QPayPayment.create({
      invoiceId: paymentIntent.id,
      senderInvoiceNo: reference,
      amount: paymentAmount,
      description,
      status: 'pending',
      qpayShortUrl: session.url,
      qrText: session.id,
      callbackUrl: process.env.WIRE_WEBHOOK_URL || null,
      expiresAt,
      metadata: {
        restaurantId: Number(restaurantId),
        items,
        phone,
        deliveryAddress: deliveryAddress.trim(),
        userId: req.userId,
        checkoutSessionId: session.id,
      },
    });

    res.status(201).json({
      ...serializeQPayPayment(payment),
      checkoutUrl: session.url,
      paymentIntentId: paymentIntent.id,
      checkoutSessionId: session.id,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const payment = await QPayPayment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Not found' });

    const metadata = payment.metadata || {};
    if (metadata.userId && metadata.userId !== req.userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await syncPaymentStatus(payment);
    const refreshed = await QPayPayment.findByPk(payment.id, {
      include: [{ model: Order, as: 'order', attributes: ['orderNumber'] }],
    });

    res.json({
      ...serializeQPayPayment(refreshed),
      checkoutUrl: refreshed.qpayShortUrl,
      order: result.order,
      wireStatus: result.status,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/webhook', async (req, res, next) => {
  try {
    const secret = process.env.WIRE_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(503).json({ error: 'Webhook secret тохируулаагүй' });
    }

    const rawBody = req.rawBody?.toString('utf8') || '';
    const signature = req.headers['wirepayment-signature'];
    const event = await verifyWebhookSignature(rawBody, signature, secret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntentId = event.data?.object?.id || event.data?.id;
      if (paymentIntentId) {
        await handleWirePaymentSucceeded(paymentIntentId);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Wire webhook error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const payments = await QPayPayment.findAll({
      include: [{ model: Order, as: 'order', attributes: ['orderNumber'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(payments.map(serializeQPayPayment));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const payment = await QPayPayment.findByPk(req.params.id, {
      include: [{ model: Order, as: 'order', attributes: ['orderNumber'] }],
    });
    if (!payment) return res.status(404).json({ error: 'Not found' });
    res.json({
      ...serializeQPayPayment(payment),
      checkoutUrl: payment.qpayShortUrl,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payment = await QPayPayment.create(req.body);
    res.status(201).json(serializeQPayPayment(payment));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payment = await QPayPayment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Not found' });
    await payment.update(req.body);
    res.json(serializeQPayPayment(payment));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const payment = await QPayPayment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Not found' });
    await payment.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
