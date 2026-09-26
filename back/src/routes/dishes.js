import { Router } from 'express';
import { Op } from 'sequelize';
import { Category, Dish, Restaurant } from '../models/index.js';
import { serializeDish } from '../utils/serializers.js';

const router = Router();

function dishPayload(body) {
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((url) => typeof url === 'string' && url.trim())
    : [];
  const imageUrl = (typeof body.imageUrl === 'string' && body.imageUrl.trim()) || imageUrls[0] || '';
  const urls = imageUrls.length ? imageUrls : imageUrl ? [imageUrl] : [];
  return {
    slug: body.slug,
    name: body.name,
    price: Number(body.price) || 0,
    badge: body.badge || '',
    badgeType: body.badgeType || 'none',
    servings: body.servings || '1 хүн',
    likes: Number(body.likes) || 0,
    isActive: body.isActive !== false,
    restaurantId: body.restaurantId,
    categoryId: body.categoryId || null,
    imageUrl,
    imageUrls: urls,
  };
}

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
    const payload = dishPayload(req.body);
    if (!payload.imageUrl) return res.status(400).json({ error: 'Зураг оруулна уу' });
    if (!payload.categoryId) return res.status(400).json({ error: 'Ангилал сонгоно уу' });
    const dish = await Dish.create(payload);
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
    const payload = dishPayload({ ...dish.toJSON(), ...req.body });
    if (!payload.imageUrl) return res.status(400).json({ error: 'Зураг оруулна уу' });
    await dish.update(payload);
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
