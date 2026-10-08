import Category from './Category.js';
import Dish from './Dish.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import Restaurant from './Restaurant.js';
import RestaurantCategory from './RestaurantCategory.js';
import User from './User.js';
import QPayPayment from './QPayPayment.js';
import Setting from './Setting.js';
import ReferralClick from './ReferralClick.js';
import UserReferral from './UserReferral.js';

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

User.belongsTo(User, { foreignKey: 'invitedByUserId', as: 'invitedBy' });
User.hasMany(UserReferral, { foreignKey: 'inviterUserId', as: 'sentReferrals' });
User.hasMany(UserReferral, { foreignKey: 'inviteeUserId', as: 'receivedReferral' });
UserReferral.belongsTo(User, { foreignKey: 'inviterUserId', as: 'inviter' });
UserReferral.belongsTo(User, { foreignKey: 'inviteeUserId', as: 'invitee' });
UserReferral.belongsTo(ReferralClick, { foreignKey: 'clickId', as: 'click' });
ReferralClick.belongsTo(User, { foreignKey: 'inviterUserId', as: 'inviter' });

export {
  Category,
  Dish,
  Order,
  OrderItem,
  QPayPayment,
  ReferralClick,
  Restaurant,
  RestaurantCategory,
  Setting,
  User,
  UserReferral,
};
