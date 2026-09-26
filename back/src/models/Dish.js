import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Dish = sequelize.define(
  'Dish',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false },
    imageUrl: { type: DataTypes.TEXT, allowNull: false },
    imageUrls: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    badge: { type: DataTypes.STRING, defaultValue: '' },
    badgeType: {
      type: DataTypes.ENUM('discount', 'newItem', 'none'),
      defaultValue: 'none',
    },
    servings: { type: DataTypes.STRING, defaultValue: '1 хүн' },
    likes: { type: DataTypes.INTEGER, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    restaurantId: { type: DataTypes.INTEGER, allowNull: false },
    categoryId: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: 'dishes', underscored: true },
);

export default Dish;
