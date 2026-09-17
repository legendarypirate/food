import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import sequelize from './config/database.js';
import './models/index.js';
import apiRoutes from './routes/index.js';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api', apiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();
  app.listen(port, () => {
    console.log(`foody API running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
