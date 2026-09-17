import { Router } from 'express';
import { Op } from 'sequelize';
import { Category, Dish, Restaurant } from '../models/index.js';
import { serializeDish } from '../utils/serializers.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, q, restaurantId } = req.query;
    const where = {};
    if (req.query.admin !== '1') where.isActive = true;
    if (restaurantId) where.restaurantId = restaurantId;
    if (q) where.name = { [Op.iLike]: `%${q}%` };

    let dishes = await Dish.findAll({
      where,
      include: [{ model: Category, as: 'category' }, { model: Restaurant, as: 'restaurant' }],
      order: [['likes', 'DESC']],
    });

    if (category && category !== 'Бүгд') {
      dishes = dishes.filter((d) => d.category?.name === category);
    }

    res.json(dishes.map(serializeDish));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const dish = await Dish.create(req.body);
    const full = await Dish.findByPk(dish.id, {
      include: [{ model: Category, as: 'category' }],
    });
    res.status(201).json(serializeDish(full));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const dish = await Dish.findByPk(req.params.id);
    if (!dish) return res.status(404).json({ error: 'Not found' });
    await dish.update(req.body);
    const full = await Dish.findByPk(dish.id, {
      include: [{ model: Category, as: 'category' }],
    });
    res.json(serializeDish(full));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const dish = await Dish.findByPk(req.params.id);
    if (!dish) return res.status(404).json({ error: 'Not found' });
    await dish.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
