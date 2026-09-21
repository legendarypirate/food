import { Server } from 'socket.io';
import { resolveUserFromToken } from './middleware/auth.js';
import {
  canWatchOrder,
  getCourierLocation,
  isValidCoord,
  updateCourierLocation,
} from './services/driverLocation.js';

function tokenFromHandshake(socket) {
  const auth = socket.handshake.auth || {};
  const query = socket.handshake.query || {};
  const header = socket.handshake.headers?.authorization || '';
  if (typeof auth.token === 'string' && auth.token) return auth.token;
  if (typeof query.token === 'string' && query.token) return query.token;
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const user = await resolveUserFromToken(tokenFromHandshake(socket));
      if (!user) {
        next(new Error('Unauthorized'));
        return;
      }
      socket.user = user;
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    socket.on('watch:order', async (payload) => {
      const orderId = payload?.orderId ?? payload;
      const order = await canWatchOrder(socket.user, orderId);
      if (!order) {
        socket.emit('driver:location:error', { error: 'Захиалга харах эрхгүй' });
        return;
      }

      socket.join(`order:${order.id}`);
      const loc = await getCourierLocation(order.courierId);
      if (loc) {
        socket.emit('driver:location', {
          orderId: String(order.id),
          ...loc,
        });
      }
    });

    socket.on('unwatch:order', (payload) => {
      const orderId = payload?.orderId ?? payload;
      if (orderId) socket.leave(`order:${orderId}`);
    });

    socket.on('driver:location', async (payload) => {
      if (socket.user.role !== 'courier') return;
      const lat = Number(payload?.lat);
      const lng = Number(payload?.lng);
      if (!isValidCoord(lat, lng)) return;
      await updateCourierLocation(socket.user.id, lat, lng);
    });
  });

  return io;
}
