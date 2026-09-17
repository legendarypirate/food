import { Router } from 'express';
import { User } from '../models/index.js';
import { serializeUser } from '../utils/serializers.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const users = await User.findAll({ order: [['created_at', 'DESC']] });
    res.json(users.map(serializeUser));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(serializeUser(user));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    await user.update(req.body);
    res.json(serializeUser(user));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    await user.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
