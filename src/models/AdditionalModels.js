const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
    supplier_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    supplier_name: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(100) },
    address: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW } // Tambahan sesuai screenshot
}, { tableName: 'supplier', timestamps: false });

const StockLog = sequelize.define('StockLog', {
    log_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER },
    old_stock: { type: DataTypes.INTEGER },
    new_stock: { type: DataTypes.INTEGER },
    activity: { type: DataTypes.STRING(100) },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW } // Tambahan sesuai screenshot
}, { tableName: 'stock_log', timestamps: false });

const Notification = sequelize.define('Notification', {
    notification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(100) },
    message: { type: DataTypes.TEXT },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'notification', timestamps: false });

module.exports = { Supplier, StockLog, Notification };