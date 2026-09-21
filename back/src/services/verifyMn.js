import crypto from 'node:crypto';
import { normalizePhone } from '../utils/phone.js';

const VERIFY_MN_BASE = 'https://api.verify.mn';
const pendingSessions = new Map();

function apiKey() {
  const key = process.env.VERIFY_MN_API_KEY;
  if (!key) {
    const err = new Error('VERIFY_MN_API_KEY is not configured');
    err.statusCode = 500;
    throw err;
  }
  return key;
}

function sixDigitCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

async function readJson(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function createVerifyMnSession(phone) {
  const key = apiKey();
  const normalized = normalizePhone(phone);
  let lastError = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const text = sixDigitCode();
    const res = await fetch(`${VERIFY_MN_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        phone: normalized,
        text,
        responseSms: 'foody: Verification received. Thank you.',
      }),
    });
    const body = await readJson(res);

    if (res.ok) {
      return {
        sessionId: body.sessionId,
        phone: body.phone || normalized,
        shortcode: body.shortcode || '144773',
        text: body.text || text,
        smsUri: body.smsUri || `sms:144773?body=${text}`,
        displayInstruction: body.displayInstruction,
        expiresAt: body.expiresAt,
      };
    }

    if (res.status === 409) {
      lastError = httpError(409, body.message || 'Идэвхтэй SESSION байна, шинэ код үүсгэж байна');
      continue;
    }
    if (res.status === 401) {
      throw httpError(500, 'VERIFY_MN_API_KEY буруу эсвэл хүчингүй');
    }
    throw httpError(res.status >= 400 ? res.status : 500, body.message || 'verify.mn session үүсгэж чадсангүй');
  }

  throw lastError || httpError(409, 'Идэвхтэй SESSION байна. Хэсэг хүлээгээд дахин оролдоно уу');
}

export async function getVerifyMnSession(sessionId) {
  const res = await fetch(`${VERIFY_MN_BASE}/sessions/${encodeURIComponent(sessionId)}`);
  const body = await readJson(res);
  if (res.status === 404) {
    throw httpError(404, 'SESSION олдсонгүй');
  }
  if (!res.ok) {
    throw httpError(res.status >= 400 ? res.status : 500, body.message || 'verify.mn статус авахад алдаа гарлаа');
  }
  return body;
}

export function rememberVerifySession(sessionId, meta) {
  pendingSessions.set(sessionId, {
    ...meta,
    consumed: false,
    createdAt: Date.now(),
  });
}

export function getRememberedSession(sessionId) {
  return pendingSessions.get(sessionId) || null;
}

export function consumeVerifySession(sessionId) {
  const session = pendingSessions.get(sessionId);
  if (!session) return null;
  session.consumed = true;
  pendingSessions.set(sessionId, session);
  return session;
}

export function pruneVerifySessions() {
  const now = Date.now();
  for (const [id, session] of pendingSessions) {
    if (now - session.createdAt > 15 * 60 * 1000) {
      pendingSessions.delete(id);
    }
  }
}
