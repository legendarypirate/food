import { Router } from 'express';
import { Order, QPayPayment } from '../models/index.js';
import { serializeQPayPayment } from '../utils/serializers.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const payments = await QPayPayment.findAll({
      include: [{ model: Order, as: 'order', attributes: ['orderNumber'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(payments.map(serializeQPayPayment));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const payment = await QPayPayment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Not found' });
    res.json(serializeQPayPayment(payment));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payment = await QPayPayment.create(req.body);
    res.status(201).json(serializeQPayPayment(payment));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payment = await QPayPayment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Not found' });
    await payment.update(req.body);
    res.json(serializeQPayPayment(payment));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const payment = await QPayPayment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Not found' });
    await payment.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
