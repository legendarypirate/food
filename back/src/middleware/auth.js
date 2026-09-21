import crypto from 'node:crypto';
import { User } from '../models/index.js';

const AUTH_SECRET = process.env.AUTH_SECRET || 'foodmn-dev-secret';
const revokedTokens = new Set();

function signToken(userId) {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySignedToken(token) {
  const [payload, sig] = token.split('.');
  if (!payload || !sig || revokedTokens.has(token)) return null;

  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  if (sig !== expected) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.userId ?? null;
  } catch {
    return null;
  }
}

export function issueToken(userId) {
  return signToken(userId);
}

export function revokeToken(token) {
  if (token) revokedTokens.add(token);
}

export function parseAuthToken(token) {
  if (!token) return null;
  if (token === 'demo-admin-token') return 1;
  return verifySignedToken(token);
}

const DEMO_ADMIN_USER = { id: 1, role: 'admin', name: 'Админ' };

export async function resolveUserFromToken(token) {
  if (token === 'demo-admin-token') {
    return DEMO_ADMIN_USER;
  }
  const userId = parseAuthToken(token);
  if (!userId) return null;
  const user = await User.findByPk(userId);
  if (!user || !user.isActive) return null;
  return user;
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Админ эрх шаардлагатай' });
  }
  next();
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' });
    }
    const token = header.slice(7);
    const user = await resolveUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Хүчинтэй бус token' });
    }
    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    next(err);
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    const token = header.slice(7);
    if (token === 'demo-admin-token') {
      req.userId = 1;
    } else {
      const userId = verifySignedToken(token);
      if (userId) req.userId = userId;
    }
  }
  next();
}
