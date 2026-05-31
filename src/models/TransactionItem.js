const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TransactionItem = sequelize.define('TransactionItem', {
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    priceAtTransaction: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = TransactionItem;