import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { getPaymentSettings, setPaymentsEnabled } from '../services/appSettings.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json(await getPaymentSettings());
  } catch (err) {
    next(err);
  }
});

router.put('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (typeof req.body.paymentsEnabled !== 'boolean') {
      return res.status(400).json({ error: 'paymentsEnabled boolean шаардлагатай' });
    }
    res.json(await setPaymentsEnabled(req.body.paymentsEnabled));
  } catch (err) {
    next(err);
  }
});

export default router;
