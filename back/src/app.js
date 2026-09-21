import 'dotenv/config';
import http from 'node:http';
import cors from 'cors';
import express from 'express';
import sequelize from './config/database.js';
import './models/index.js';
import apiRoutes from './routes/index.js';
import { initPushNotifications } from './services/pushNotification.js';
import { attachIo } from './services/driverLocation.js';
import { initSocket } from './socket.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : null;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (!allowedOrigins || allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Admin on same host, port 3000 -> API on 3001
  if (/^https?:\/\/[\w.-]+:3000$/.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);
app.use(express.json());

app.use('/api', apiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  initPushNotifications();
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const server = http.createServer(app);
  const io = initSocket(server);
  attachIo(io);

  server.listen(port, host, () => {
    console.log(`foody API running on http://${host}:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
