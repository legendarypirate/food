import { Router } from 'express';
import { Op } from 'sequelize';
import { Category, Restaurant } from '../models/index.js';
import { serializeRestaurant } from '../utils/serializers.js';

const router = Router();

async function loadRestaurant(id) {
  return Restaurant.findByPk(id, { include: [{ model: Category, through: { attributes: [] } }] });
}

router.get('/', async (req, res, next) => {
  try {
    const { category, q } = req.query;
    const where = {};
    if (req.query.admin !== '1') where.isActive = true;
    const include = [{ model: Category, through: { attributes: [] } }];

    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } },
      ];
    }

    let restaurants = await Restaurant.findAll({
      where,
      include,
      order: [['rating', 'DESC']],
    });

    if (category && category !== 'Бүгд') {
      restaurants = restaurants.filter((r) =>
        r.Categories.some((c) => c.name === category),
      );
    }

    res.json(restaurants.map(serializeRestaurant));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const restaurant = await loadRestaurant(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Not found' });
    res.json(serializeRestaurant(restaurant));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { categoryIds = [], ...data } = req.body;
    const restaurant = await Restaurant.create(data);
    if (categoryIds.length) {
      await restaurant.setCategories(categoryIds);
    }
    const full = await loadRestaurant(restaurant.id);
    res.status(201).json(serializeRestaurant(full));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Not found' });
    const { categoryIds, ...data } = req.body;
    await restaurant.update(data);
    if (categoryIds) await restaurant.setCategories(categoryIds);
    const full = await loadRestaurant(restaurant.id);
    res.json(serializeRestaurant(full));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Not found' });
    await restaurant.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
