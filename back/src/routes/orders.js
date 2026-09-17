import { Router } from 'express';
import { Order, OrderItem, Restaurant } from '../models/index.js';
import { serializeOrder } from '../utils/serializers.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const orders = await Order.findAll({
      where,
      include: [
        { model: Restaurant, as: 'restaurant' },
        { model: OrderItem, as: 'items' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders.map(serializeOrder));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Restaurant, as: 'restaurant' },
        { model: OrderItem, as: 'items' },
      ],
    });
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json(serializeOrder(order));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Restaurant, as: 'restaurant' },
        { model: OrderItem, as: 'items' },
      ],
    });
    if (!order) return res.status(404).json({ error: 'Not found' });
    await order.update({ status: req.body.status });
    res.json(serializeOrder(order));
  } catch (err) {
    next(err);
  }
});

export default router;
