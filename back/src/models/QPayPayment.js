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
    // "Даалгах" — the order owner asks a friend to pay this payment.
    payerUserId: { type: DataTypes.INTEGER, allowNull: true, field: 'payer_user_id' },
    payerPhone: { type: DataTypes.STRING(32), allowNull: true, field: 'payer_phone' },
    payerNote: { type: DataTypes.TEXT, allowNull: true, field: 'payer_note' },
    payerRequestStatus: {
      // pending | paid | declined | cancelled
      type: DataTypes.STRING(16),
      allowNull: true,
      field: 'payer_request_status',
    },
    payerRequestedAt: { type: DataTypes.DATE, allowNull: true, field: 'payer_requested_at' },
    payerRespondedAt: { type: DataTypes.DATE, allowNull: true, field: 'payer_responded_at' },
  },
  { tableName: 'qpay_payments', underscored: true },
);

export default QPayPayment;
