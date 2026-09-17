import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    role: {
      type: DataTypes.ENUM('admin', 'customer', 'courier'),
      defaultValue: 'customer',
    },
    membershipLevel: { type: DataTypes.STRING, defaultValue: 'Gold' },
    points: { type: DataTypes.INTEGER, defaultValue: 0 },
    orderCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    avatarUrl: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'users', underscored: true },
);

export default User;
