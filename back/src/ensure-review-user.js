import 'dotenv/config';
import sequelize from './config/database.js';
import './models/index.js';
import { ensureReviewUser } from './services/reviewUser.js';

await sequelize.authenticate();
await sequelize.sync({ alter: true });
await ensureReviewUser();
await sequelize.close();
