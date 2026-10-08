import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ReferralClick = sequelize.define(
  'ReferralClick',
  {
    clickId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'click_id',
    },
    referralCode: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'referral_code',
    },
    inviterUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'inviter_user_id',
    },
    ipHash: { type: DataTypes.STRING(64), allowNull: true, field: 'ip_hash' },
    userAgent: { type: DataTypes.STRING(512), allowNull: true, field: 'user_agent' },
  },
  {
    tableName: 'referral_clicks',
    underscored: true,
    updatedAt: false,
  },
);

export default ReferralClick;
