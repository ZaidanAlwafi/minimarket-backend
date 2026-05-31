const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define(
  'Transaction',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    totalPrice: { type: DataTypes.INTEGER, allowNull: false },
    staffName: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'transactions', timestamps: true }
);

const TransactionItem = sequelize.define(
  'TransactionItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    subtotal: { type: DataTypes.INTEGER, allowNull: false },
    TransactionId: { type: DataTypes.INTEGER },
    ProductId: { type: DataTypes.INTEGER },
  },
  { tableName: 'transactionitems', timestamps: true }
);

module.exports = { Transaction, TransactionItem };
