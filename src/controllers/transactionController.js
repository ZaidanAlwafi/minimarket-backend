const { Transaction, TransactionItem } = require('../models/Transaction');
const Product = require('../models/Product');
const { StockLog, Notification } = require('../models/AdditionalModels');
const sequelize = require('../config/database');

exports.checkout = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Keranjang POS kosong.' });
    }

    let totalAll = 0;
    const lineItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (!product) throw new Error(`Produk ID ${item.productId} tidak ditemukan`);

      const oldStock = product.stock;
      const qty = Number(item.quantity) || 0;
      if (qty < 1) continue;
      const newStock = oldStock - qty;
      if (newStock < 0) throw new Error(`Stok ${product.product_name} tidak mencukupi`);

      await StockLog.create(
        {
          product_id: product.product_id,
          old_stock: oldStock,
          new_stock: newStock,
          activity: `Penjualan POS oleh ${req.user.name || 'Admin'}`,
        },
        { transaction: t }
      );

      const min = Number(product.minimum_stock) || 10;
      if (newStock < min) {
        await Notification.create(
          {
            title: 'Peringatan Stok',
            message: `Stok ${product.product_name} menipis! Sisa: ${newStock}`,
            is_read: false,
          },
          { transaction: t }
        );
      }

      await product.update({ stock: newStock }, { transaction: t });
      const subtotal = Math.round(Number(product.price) * qty);
      totalAll += subtotal;
      lineItems.push({ product, qty, subtotal });
    }

    if (lineItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Tidak ada item valid.' });
    }

    const newTransaction = await Transaction.create(
      { totalPrice: totalAll, staffName: req.user.name || 'Admin' },
      { transaction: t }
    );

    for (const row of lineItems) {
      await TransactionItem.create(
        {
          TransactionId: newTransaction.id,
          ProductId: row.product.product_id,
          quantity: row.qty,
          subtotal: row.subtotal,
        },
        { transaction: t }
      );
    }

    await t.commit();
    res.status(201).json({
      message: 'Checkout Berhasil!',
      transaction: {
        id: newTransaction.id,
        total: totalAll,
        staffName: newTransaction.staffName,
        ts: newTransaction.createdAt ? new Date(newTransaction.createdAt).getTime() : Date.now(),
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await Transaction.findAll({
      order: [['id', 'DESC']],
      limit: 100,
    });
    res.json(
      history.map((tx) => ({
        id: tx.id,
        total: Number(tx.totalPrice) || 0,
        staffName: tx.staffName,
        ts: tx.createdAt ? new Date(tx.createdAt).getTime() : Date.now(),
        date: tx.createdAt ? new Date(tx.createdAt).toLocaleString('id-ID') : '',
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
