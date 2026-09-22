import crypto from 'node:crypto';

const WIRE_API_BASE = process.env.WIRE_API_BASE || 'https://api.wire.mn/v1';

function getApiKey() {
  const key = process.env.WIRE_API_KEY;
  if (!key) {
    throw new Error('WIRE_API_KEY тохируулаагүй байна');
  }
  return key;
}

export function isWireConfigured() {
  return Boolean(process.env.WIRE_API_KEY);
}

export function getAllowedOperators() {
  const configured = process.env.WIRE_ALLOWED_OPERATORS;
  if (configured) {
    return configured.split(',').map((value) => value.trim()).filter(Boolean);
  }
  const key = process.env.WIRE_API_KEY || '';
  return key.startsWith('sk_test_') ? ['sandbox'] : [];
}

async function wireRequest(method, path, { body, idempotencyKey } = {}) {
  const headers = {
    Authorization: `Bearer ${getApiKey()}`,
    Accept: 'application/json',
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const init = { method, headers };

  if (body) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${WIRE_API_BASE}${path}`, init);
  const text = await res.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const message = data?.error?.message || data?.message || text || `Wire API ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function createPaymentIntent({ amount, description, reference, allowedOperators }) {
  return wireRequest('POST', '/payment_intents', {
    body: {
      amount: Number(amount),
      currency: 'MNT',
      description,
      allowed_operators: allowedOperators,
    },
    idempotencyKey: reference,
  });
}

export async function createCheckoutSession({ paymentIntentId, reference }) {
  return wireRequest('POST', '/checkout/sessions', {
    body: { payment_intent: paymentIntentId },
    idempotencyKey: `sess-${reference}`,
  });
}

export async function retrievePaymentIntent(paymentIntentId) {
  return wireRequest('GET', `/payment_intents/${paymentIntentId}`);
}

export function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) {
    throw new Error('Webhook signature эсвэл secret байхгүй');
  }

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.trim().split('=');
      return [key, value];
    }),
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) {
    throw new Error('Webhook signature формат буруу');
  }

  const toleranceSec = Number(process.env.WIRE_WEBHOOK_TOLERANCE_SEC || 300);
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (ageSec > toleranceSec) {
    throw new Error('Webhook timestamp хугацаа дууссан');
  }

  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const valid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex'),
  );

  if (!valid) {
    throw new Error('Webhook signature буруу');
  }

  return JSON.parse(rawBody);
}
