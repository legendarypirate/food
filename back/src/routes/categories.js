import { Router } from 'express';
import { Category } from '../models/index.js';
import { serializeCategory } from '../utils/serializers.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [['sortOrder', 'ASC']] });
    res.json(categories.map(serializeCategory));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(serializeCategory(category));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Not found' });
    await category.update(req.body);
    res.json(serializeCategory(category));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Not found' });
    await category.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
