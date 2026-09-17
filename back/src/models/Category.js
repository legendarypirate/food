import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Category = sequelize.define(
  'Category',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING, defaultValue: 'restaurant' },
    gradientStart: { type: DataTypes.STRING, defaultValue: '#A32719' },
    gradientEnd: { type: DataTypes.STRING, defaultValue: '#8B2115' },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: 'categories', underscored: true },
);

export default Category;
