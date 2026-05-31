const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockIn = sequelize.define(
  'StockIn',
  {
    stockin_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    supplier_id: { type: DataTypes.INTEGER },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    date_in: { type: DataTypes.DATE },
  },
  { tableName: 'stock_in', timestamps: false }
);

const StockReturn = sequelize.define(
  'StockReturn',
  {
    return_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    supplier_id: { type: DataTypes.INTEGER },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.TEXT },
    return_date: { type: DataTypes.DATE },
  },
  { tableName: 'stock_return', timestamps: false }
);

module.exports = { StockIn, StockReturn };
