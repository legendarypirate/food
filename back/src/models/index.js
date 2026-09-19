import Category from './Category.js';
import Dish from './Dish.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import Restaurant from './Restaurant.js';
import RestaurantCategory from './RestaurantCategory.js';
import User from './User.js';
import QPayPayment from './QPayPayment.js';

Category.belongsToMany(Restaurant, {
  through: RestaurantCategory,
  foreignKey: 'categoryId',
  otherKey: 'restaurantId',
});
Restaurant.belongsToMany(Category, {
  through: RestaurantCategory,
  foreignKey: 'restaurantId',
  otherKey: 'categoryId',
});

Restaurant.hasMany(Dish, { foreignKey: 'restaurantId', as: 'dishes' });
Dish.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Dish.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Dish, { foreignKey: 'categoryId', as: 'dishes' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'courierId', as: 'deliveries' });
Order.belongsTo(User, { foreignKey: 'courierId', as: 'courier' });

Restaurant.hasMany(Order, { foreignKey: 'restaurantId', as: 'orders' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurantId', as: 'restaurant' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.hasMany(QPayPayment, { foreignKey: 'orderId', as: 'payments' });
QPayPayment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

export {
  Category,
  Dish,
  Order,
  OrderItem,
  QPayPayment,
  Restaurant,
  RestaurantCategory,
  User,
};
