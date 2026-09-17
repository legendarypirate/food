import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import sequelize from './config/database.js';
import './models/index.js';
import apiRoutes from './routes/index.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : null;

app.use(
  cors(
    allowedOrigins
      ? {
          origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error(`CORS blocked: ${origin}`));
            }
          },
          credentials: true,
        }
      : { origin: true },
  ),
);
app.use(express.json());

app.use('/api', apiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();
  app.listen(port, host, () => {
    console.log(`foody API running on http://${host}:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
