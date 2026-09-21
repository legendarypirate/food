import { Order, User } from '../models/index.js';

const cache = new Map();
const lastPersistAt = new Map();
const PERSIST_INTERVAL_MS = 10_000;

let ioRef = null;

export function attachIo(io) {
  ioRef = io;
}

export function isValidCoord(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function locationFromUser(user) {
  if (user?.lastLat == null || user?.lastLng == null) return null;
  return {
    lat: Number(user.lastLat),
    lng: Number(user.lastLng),
    updatedAt: user.lastLocationAt
      ? new Date(user.lastLocationAt).toISOString()
      : null,
  };
}

export function getCachedLocation(courierId) {
  return cache.get(Number(courierId)) ?? null;
}

export async function getCourierLocation(courierId) {
  const id = Number(courierId);
  if (!id) return null;
  const cached = cache.get(id);
  if (cached) return cached;

  const user = await User.findByPk(id, {
    attributes: ['id', 'lastLat', 'lastLng', 'lastLocationAt'],
  });
  const loc = locationFromUser(user);
  if (loc) cache.set(id, loc);
  return loc;
}

export async function updateCourierLocation(courierId, lat, lng) {
  const id = Number(courierId);
  if (!id || !isValidCoord(lat, lng)) return null;

  const loc = {
    lat: Number(lat),
    lng: Number(lng),
    updatedAt: new Date().toISOString(),
  };
  cache.set(id, loc);

  const last = lastPersistAt.get(id) || 0;
  if (Date.now() - last >= PERSIST_INTERVAL_MS) {
    lastPersistAt.set(id, Date.now());
    User.update(
      { lastLat: loc.lat, lastLng: loc.lng, lastLocationAt: loc.updatedAt },
      { where: { id } },
    ).catch(() => {});
  }

  const orders = await Order.findAll({
    where: { courierId: id, status: 'active' },
    attributes: ['id'],
  });

  for (const order of orders) {
    ioRef?.to(`order:${order.id}`).emit('driver:location', {
      orderId: String(order.id),
      ...loc,
    });
  }

  return loc;
}

export async function canWatchOrder(user, orderId) {
  const order = await Order.findByPk(orderId, {
    attributes: ['id', 'userId', 'courierId', 'status'],
  });
  if (!order) return null;
  if (order.status !== 'active' || !order.courierId) return null;

  const isOwner = order.userId === user.id;
  const isAdmin = user.role === 'admin';
  const isAssignedCourier = user.role === 'courier' && order.courierId === user.id;
  if (!isOwner && !isAdmin && !isAssignedCourier) return null;
  return order;
}
