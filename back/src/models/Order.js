import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    restaurantId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('active', 'delivered', 'cancelled'),
      defaultValue: 'active',
    },
    total: { type: DataTypes.INTEGER, allowNull: false },
    deliveryAddress: { type: DataTypes.STRING, allowNull: false },
    dateLabel: { type: DataTypes.STRING, allowNull: false },
    estimatedMinutes: { type: DataTypes.INTEGER, allowNull: true },
    tracking: { type: DataTypes.JSONB, allowNull: true },
  },
  { tableName: 'orders', underscored: true },
);

export default Order;
