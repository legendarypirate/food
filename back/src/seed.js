import sequelize from './config/database.js';
import {
  Category,
  Dish,
  Order,
  OrderItem,
  QPayPayment,
  Restaurant,
  User,
} from './models/index.js';

const categories = [
  { slug: 'all', name: 'Бүгд', icon: 'apps', gradientStart: '#6B7280', gradientEnd: '#4B5563', sortOrder: 0 },
  { slug: 'popular', name: 'Эрэлттэй 🔥', icon: 'local_fire_department', gradientStart: '#A32719', gradientEnd: '#8B2115', sortOrder: 1 },
  { slug: 'beef', name: 'Үхрийн махтай', icon: 'restaurant', gradientStart: '#7C2D12', gradientEnd: '#9A3412', sortOrder: 2 },
  { slug: 'chicken', name: 'Тахианы', icon: 'egg', gradientStart: '#B45309', gradientEnd: '#D97706', sortOrder: 3 },
  { slug: 'chinese', name: 'Хятад', icon: 'ramen_dining', gradientStart: '#1E6342', gradientEnd: '#0D7C4F', sortOrder: 4 },
  { slug: 'japanese', name: 'Япон', icon: 'set_meal', gradientStart: '#1E3A5F', gradientEnd: '#2563EB', sortOrder: 5 },
];

const restaurants = [
  {
    slug: 'r1',
    name: 'foodmn Cloud Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
    rating: 4.9,
    reviewCount: 1200,
    deliveryTime: '15–25 мин',
    hours: '12:00–23:59',
    deliveryFee: 0,
    badge: 'Cloud Kitchen',
    location: 'СБД',
    freeDelivery: true,
    categorySlugs: ['popular', 'japanese'],
  },
  {
    slug: 'r2',
    name: 'The Bull Hotpot',
    imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e09052?w=800&q=80',
    rating: 4.8,
    reviewCount: 890,
    deliveryTime: '20–30 мин',
    hours: '11:00–22:00',
    deliveryFee: 3500,
    badge: 'Cloud Kitchen',
    location: 'ХУД',
    freeDelivery: false,
    categorySlugs: ['popular', 'chinese'],
  },
  {
    slug: 'r3',
    name: 'Artisan Burger & Grill',
    imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457a45?w=800&q=80',
    rating: 4.7,
    reviewCount: 650,
    deliveryTime: '25–35 мин',
    hours: '10:00–23:00',
    deliveryFee: 2500,
    badge: 'Cloud Kitchen',
    location: 'БГД',
    freeDelivery: false,
    categorySlugs: ['beef', 'chicken'],
  },
  {
    slug: 'r4',
    name: 'Tokyo Ramen House',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
    rating: 4.6,
    reviewCount: 420,
    deliveryTime: '18–28 мин',
    hours: '11:00–21:30',
    deliveryFee: 3000,
    badge: 'Шинэ',
    location: 'ЧД',
    freeDelivery: false,
    categorySlugs: ['japanese', 'popular'],
  },
];

const dishes = [
  { slug: 'd1', name: 'Тарган сайхан сет', price: 15900, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80', badge: '10% OFF', badgeType: 'discount', servings: '1 хүн', likes: 315, restaurantSlug: 'r3', categorySlug: 'popular' },
  { slug: 'd2', name: 'Ramen Set', price: 22500, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80', badge: 'Шинэ', badgeType: 'newItem', servings: '1 хүн', likes: 248, restaurantSlug: 'r1', categorySlug: 'japanese' },
  { slug: 'd3', name: 'BBQ Burger', price: 18900, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80', badge: '15% OFF', badgeType: 'discount', servings: '2 хүн', likes: 412, restaurantSlug: 'r3', categorySlug: 'beef' },
  { slug: 'd4', name: 'Hotpot Deluxe', price: 34900, imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e09052?w=600&q=80', badge: 'Шинэ', badgeType: 'newItem', servings: '2–3 хүн', likes: 189, restaurantSlug: 'r2', categorySlug: 'chinese' },
  { slug: 'd5', name: 'Chicken Teriyaki', price: 17500, imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866258177?w=600&q=80', badge: '10% OFF', badgeType: 'discount', servings: '1 хүн', likes: 276, restaurantSlug: 'r4', categorySlug: 'chicken' },
];

const activeTracking = {
  orderNumber: 'ORD-8921',
  restaurantLabel: 'foodmn Cloud Kitchen / Artisan Burger',
  destinationLabel: 'Гэр (Хүннү 2222)',
  etaRange: '16–20 минутын дараа хүрнэ',
  estimatedArrival: '19:42',
  steps: [
    { label: 'Баталгаажсан', icon: 'check', state: 'completed', time: '19:14' },
    { label: 'Бэлтгэгдсэн', icon: 'soup_kitchen', state: 'completed', time: '19:25' },
    { label: 'Хүргэлтэнд гарсан', icon: 'delivery_dining', state: 'active', subtitle: 'Замдаа явна' },
    { label: 'Хүргэгдсэн', icon: 'home', state: 'pending', subtitle: 'Хүлээгдэж буй' },
  ],
  courier: {
    name: 'Б. Бат-Эрдэнэ',
    rating: 4.9,
    vehicle: 'Toyota Prius 30',
    plateNumber: 'Мөнгөлөг (12-34 УББ)',
    deliveryCount: 1120,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    distanceKm: 0.8,
  },
};

async function seed() {
  await sequelize.sync({ force: true });

  const categoryMap = {};
  for (const c of categories) {
    const row = await Category.create(c);
    categoryMap[c.slug] = row;
  }

  const restaurantMap = {};
  for (const r of restaurants) {
    const { categorySlugs, ...data } = r;
    const row = await Restaurant.create(data);
    restaurantMap[r.slug] = row;
    const cats = categorySlugs.map((slug) => categoryMap[slug]);
    await row.setCategories(cats);
  }

  for (const d of dishes) {
    const { restaurantSlug, categorySlug, ...data } = d;
    await Dish.create({
      ...data,
      restaurantId: restaurantMap[restaurantSlug].id,
      categoryId: categoryMap[categorySlug].id,
    });
  }

  const order1 = await Order.create({
    orderNumber: 'ORD-8921',
    restaurantId: restaurantMap.r1.id,
    status: 'active',
    total: 43000,
    deliveryAddress: 'Хүннү 2222, 5-р давхар',
    dateLabel: 'Өнөөдөр 19:14',
    estimatedMinutes: 18,
    tracking: activeTracking,
  });
  await OrderItem.bulkCreate([
    { orderId: order1.id, name: 'Ramen Set', quantity: 1, price: 22500 },
    { orderId: order1.id, name: 'BBQ Burger', quantity: 1, price: 18900 },
    { orderId: order1.id, name: 'Miso Soup', quantity: 1, price: 3500 },
  ]);

  const order2 = await Order.create({
    orderNumber: 'ORD-8801',
    restaurantId: restaurantMap.r3.id,
    status: 'delivered',
    total: 18400,
    deliveryAddress: 'Хүннү 2222, 5-р давхар',
    dateLabel: 'Өчигдөр 19:40',
    estimatedMinutes: null,
    tracking: null,
  });
  await OrderItem.bulkCreate([
    { orderId: order2.id, name: 'Тарган сайхан сет', quantity: 1, price: 15900 },
  ]);

  const order3 = await Order.create({
    orderNumber: 'ORD-8700',
    restaurantId: restaurantMap.r2.id,
    status: 'delivered',
    total: 38400,
    deliveryAddress: 'Хүннү 2222, 5-р давхар',
    dateLabel: '09/12 12:15',
    estimatedMinutes: null,
    tracking: null,
  });
  await OrderItem.bulkCreate([
    { orderId: order3.id, name: 'Hotpot Deluxe', quantity: 1, price: 34900 },
  ]);

  await User.bulkCreate([
    {
      name: 'Т. Энхжин',
      phone: '+976 9911-8421',
      email: 'enkhjin.t@gmail.com',
      role: 'customer',
      membershipLevel: 'Gold',
      points: 1450,
      orderCount: 28,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    },
    {
      name: 'Б. Бат-Эрдэнэ',
      phone: '+976 8812-3344',
      email: 'bat.erden@foodmn.mn',
      role: 'courier',
      membershipLevel: 'Silver',
      points: 320,
      orderCount: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    },
    {
      name: 'Admin User',
      phone: '+976 9900-0001',
      email: 'admin@foodmn.mn',
      role: 'admin',
      membershipLevel: 'Platinum',
      points: 5000,
      orderCount: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    },
    {
      name: 'С. Оюун',
      phone: '+976 9922-7788',
      email: 'oyun.s@mail.mn',
      role: 'customer',
      membershipLevel: 'Silver',
      points: 680,
      orderCount: 12,
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    },
  ]);

  await QPayPayment.bulkCreate([
    {
      invoiceId: 'QP-2026-00039',
      senderInvoiceNo: 'PAY-ORD-8921',
      orderId: order1.id,
      amount: 43000,
      description: 'ORD-8921 захиалгын төлбөр',
      status: 'pending',
      qpayShortUrl: 'https://qpay.mn/g/abc123',
      qrText: 'QPAY|43000|ORD-8921',
      callbackUrl: 'http://localhost:3001/api/payments/callback',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      isActive: true,
    },
    {
      invoiceId: 'QP-2026-00038',
      senderInvoiceNo: 'PAY-ORD-8801',
      orderId: order2.id,
      amount: 18400,
      description: 'ORD-8801 захиалгын төлбөр',
      status: 'paid',
      qpayShortUrl: 'https://qpay.mn/g/def456',
      qrText: 'QPAY|18400|ORD-8801',
      callbackUrl: 'http://localhost:3001/api/payments/callback',
      paidAt: new Date('2026-09-16T11:40:00'),
      isActive: true,
    },
    {
      invoiceId: 'QP-2026-00037',
      senderInvoiceNo: 'PAY-ORD-8700',
      orderId: order3.id,
      amount: 38400,
      description: 'ORD-8700 захиалгын төлбөр',
      status: 'paid',
      qpayShortUrl: 'https://qpay.mn/g/ghi789',
      qrText: 'QPAY|38400|ORD-8700',
      callbackUrl: 'http://localhost:3001/api/payments/callback',
      paidAt: new Date('2026-09-12T12:20:00'),
      isActive: true,
    },
    {
      invoiceId: 'QP-2026-00036',
      senderInvoiceNo: 'PAY-WALLET-001',
      orderId: null,
      amount: 50000,
      description: 'Хэтэвч цэнэглэлт',
      status: 'expired',
      qpayShortUrl: 'https://qpay.mn/g/jkl012',
      qrText: 'QPAY|50000|WALLET',
      callbackUrl: 'http://localhost:3001/api/payments/callback',
      expiresAt: new Date('2026-09-10T18:00:00'),
      isActive: false,
    },
  ]);

  console.log('Seed complete');
  await sequelize.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
