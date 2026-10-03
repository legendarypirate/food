import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Setting = sequelize.define(
  'Setting',
  {
    key: { type: DataTypes.STRING, primaryKey: true },
    value: { type: DataTypes.TEXT, allowNull: false },
  },
  { tableName: 'settings', underscored: true },
);

export default Setting;
