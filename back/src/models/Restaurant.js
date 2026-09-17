import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Restaurant = sequelize.define(
  'Restaurant',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    imageUrl: { type: DataTypes.TEXT, allowNull: false },
    rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 4.5 },
    reviewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    deliveryTime: { type: DataTypes.STRING, defaultValue: '20–30 мин' },
    hours: { type: DataTypes.STRING, defaultValue: '10:00–22:00' },
    deliveryFee: { type: DataTypes.INTEGER, defaultValue: 0 },
    badge: { type: DataTypes.STRING, defaultValue: 'Cloud Kitchen' },
    location: { type: DataTypes.STRING, defaultValue: 'УБ' },
    freeDelivery: { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'restaurants', underscored: true },
);

export default Restaurant;
