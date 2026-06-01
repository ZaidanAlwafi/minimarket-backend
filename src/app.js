const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const sequelize = require('./config/database');

const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');
const { Transaction, TransactionItem } = require('./models/Transaction');
const { Supplier, StockLog, Notification } = require('./models/AdditionalModels');
const { Order, OrderDetail, Cart } = require('./models/OrderModels');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const userRoutes = require('./routes/userRoutes');
const stockRoutes = require('./routes/stockRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { runMigrations } = require('./config/runMigrations');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

Transaction.hasMany(TransactionItem, { foreignKey: 'TransactionId', onDelete: 'CASCADE' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'TransactionId' });
Product.hasMany(TransactionItem, { foreignKey: 'ProductId' });
TransactionItem.belongsTo(Product, { foreignKey: 'ProductId' });

Product.hasMany(StockLog, { foreignKey: 'product_id' });
StockLog.belongsTo(Product, { foreignKey: 'product_id' });

Order.hasMany(OrderDetail, { foreignKey: 'order_id', onDelete: 'CASCADE' });
OrderDetail.belongsTo(Order, { foreignKey: 'order_id' });
OrderDetail.belongsTo(Product, { foreignKey: 'product_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });
Cart.belongsTo(Product, { foreignKey: 'product_id' });
Cart.belongsTo(User, { foreignKey: 'user_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
      <h1 style="color: #2ecc71;">✅ Minimarket API Aktif</h1>
      <p>Terhubung ke database MySQL minimarket_db</p>
    </div>
  `);
});

const PORT = process.env.PORT || 3000;

async function connectDatabase(maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await sequelize.authenticate();
      console.log('✅ Berhasil terhubung ke database MySQL.');
      return;
    } catch (err) {
      const isLastAttempt = attempt === maxAttempts;
      console.error(
        `❌ Gagal terhubung ke Database (percobaan ${attempt}/${maxAttempts}):`,
        err.message
      );

      if (isLastAttempt) {
        console.error('Detail:', err.original?.code || err.name);
        console.error(
          'Periksa DB_HOST/MYSQLHOST (gunakan mysql.railway.internal), DB_PORT/MYSQLPORT, dan nama database.'
        );
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

connectDatabase()
  .then(async () => {
    // await runMigrations();
    await sequelize.sync({ alter: true });
    console.log('✅ Semua tabel berhasil dibuat/diupdate oleh Sequelize!');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server berjalan di: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Startup gagal:', err.message);
    process.exit(1);
  });

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server',
    error: err.message,
  });
});
});
