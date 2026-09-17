import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RestaurantCategory = sequelize.define(
  'RestaurantCategory',
  {
    restaurantId: { type: DataTypes.INTEGER, primaryKey: true },
    categoryId: { type: DataTypes.INTEGER, primaryKey: true },
  },
  { tableName: 'restaurant_categories', underscored: true, timestamps: false },
);

export default RestaurantCategory;
