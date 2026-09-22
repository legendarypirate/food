import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QPayPayment = sequelize.define(
  'QPayPayment',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoiceId: { type: DataTypes.STRING, allowNull: false, unique: true },
    senderInvoiceNo: { type: DataTypes.STRING, allowNull: false, unique: true },
    orderId: { type: DataTypes.INTEGER, allowNull: true },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'expired', 'cancelled'),
      defaultValue: 'pending',
    },
    qpayShortUrl: { type: DataTypes.TEXT, allowNull: true },
    qrText: { type: DataTypes.TEXT, allowNull: true },
    callbackUrl: { type: DataTypes.TEXT, allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'qpay_payments', underscored: true },
);

export default QPayPayment;
