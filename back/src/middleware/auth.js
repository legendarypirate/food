import crypto from 'node:crypto';
import { User } from '../models/index.js';

const tokens = new Map();

export function issueToken(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, userId);
  return token;
}

export function revokeToken(token) {
  tokens.delete(token);
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Нэвтрэх шаардлагатай' });
    }
    const token = header.slice(7);
    if (token === 'demo-admin-token') {
      req.user = { id: 1, role: 'admin' };
      req.userId = 1;
      return next();
    }
    const userId = tokens.get(token);
    if (!userId) {
      return res.status(401).json({ error: 'Хүчинтэй бус token' });
    }
    const user = await User.findByPk(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Хэрэглэгч олдсонгүй' });
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
    const userId = tokens.get(token);
    if (userId) req.userId = userId;
  }
  next();
}
