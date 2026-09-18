import { Router } from 'express';
import auth from './auth.js';
import categories from './categories.js';
import dishes from './dishes.js';
import orders from './orders.js';
import restaurants from './restaurants.js';
import users from './users.js';
import payments from './payments.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'foody-api' });
});

router.use('/auth', auth);
router.use('/categories', categories);
router.use('/restaurants', restaurants);
router.use('/dishes', dishes);
router.use('/orders', orders);
router.use('/users', users);
router.use('/payments', payments);

export default router;
