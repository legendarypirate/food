import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserReferral = sequelize.define(
  'UserReferral',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    inviterUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'inviter_user_id',
    },
    inviteeUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'invitee_user_id',
    },
    clickId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'click_id',
    },
    status: {
      type: DataTypes.ENUM('registered', 'completed'),
      allowNull: false,
      defaultValue: 'registered',
    },
    registeredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'registered_at',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
  },
  {
    tableName: 'user_referrals',
    underscored: true,
  },
);

export default UserReferral;
