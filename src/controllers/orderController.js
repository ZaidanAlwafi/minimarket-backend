const sequelize = require('../config/database');
const { Order, OrderDetail, Cart } = require('../models/OrderModels');
const Product = require('../models/Product');
const User = require('../models/User');
const { StockLog } = require('../models/AdditionalModels');
const { mapOrderToFe, mapOrderStatusToDb } = require('../utils/mappers');

async function loadOrderDetails(orderId) {
  const details = await OrderDetail.findAll({ where: { order_id: orderId } });
  const enriched = [];
  for (const d of details) {
    const product = await Product.findByPk(d.product_id);
    enriched.push({
      get: () => ({
        ...d.get({ plain: true }),
        Product: product ? product.get({ plain: true }) : null,
      }),
      Product: product ? product.get({ plain: true }) : null,
    });
  }
  return enriched;
}

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      order: [['order_id', 'DESC']],
    });
    const user = await User.findByPk(req.user.id);
    const result = [];
    for (const o of orders) {
      const details = await loadOrderDetails(o.order_id);
      result.push(mapOrderToFe(o, user, details));
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({ order: [['order_id', 'DESC']] });
    const result = [];
    for (const o of orders) {
      const user = await User.findByPk(o.user_id);
      const details = await loadOrderDetails(o.order_id);
      result.push(mapOrderToFe(o, user, details));
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { items, shippingAddress, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Keranjang kosong.' });
    }

    const user = await User.findByPk(userId, { transaction: t });
    let total = 0;
    const detailRows = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (!product) throw new Error(`Produk #${item.productId} tidak ditemukan`);
      const qty = Number(item.qty) || 0;
      if (qty <= 0) continue;
      if (product.stock < qty) throw new Error(`Stok ${product.product_name} tidak mencukupi`);

      const price = Number(product.price);
      const subtotal = price * qty;
      total += subtotal;
      detailRows.push({ product, qty, price, subtotal });
    }

    if (detailRows.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Tidak ada item valid.' });
    }

    const order = await Order.create(
      {
        user_id: userId,
        total_price: total,
        status: 'pending',
        payment_status: 'pending',
        payment_method: paymentMethod || 'manual',
        shipping_address: shippingAddress || user?.address || '',
        order_date: new Date(),
      },
      { transaction: t }
    );

    for (const row of detailRows) {
      const { product, qty, price, subtotal } = row;
      const oldStock = product.stock;
      const newStock = oldStock - qty;
      await OrderDetail.create(
        {
          order_id: order.order_id,
          product_id: product.product_id,
          quantity: qty,
          price,
          subtotal,
        },
        { transaction: t }
      );
      await product.update({ stock: newStock }, { transaction: t });
      await StockLog.create(
        {
          product_id: product.product_id,
          old_stock: oldStock,
          new_stock: newStock,
          activity: `Pesanan online #${order.order_id}`,
        },
        { transaction: t }
      );
    }

    await Cart.destroy({ where: { user_id: userId }, transaction: t });
    await t.commit();

    const details = await loadOrderDetails(order.order_id);
    res.status(201).json({
      message: 'Pesanan berhasil dibuat. Menunggu verifikasi pembayaran admin.',
      order: mapOrderToFe(order, user, details),
    });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Pesanan sudah dibatalkan.' });
    }

    const { action } = req.body;
    if (action === 'reject') {
      await order.update({ payment_status: 'rejected' });
    } else {
      await order.update({ payment_status: 'verified' });
    }

    const user = await User.findByPk(order.user_id);
    const details = await loadOrderDetails(order.order_id);
    res.json({
      message:
        action === 'reject'
          ? 'Pembayaran ditolak.'
          : 'Pembayaran berhasil diverifikasi.',
      order: mapOrderToFe(order, user, details),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

    const { status } = req.body;
    const dbStatus = mapOrderStatusToDb(status);

    if (dbStatus === 'processed' && order.payment_status !== 'verified') {
      return res.status(400).json({
        message:
          'Pesanan tidak dapat diproses. Verifikasi pembayaran terlebih dahulu oleh Admin.',
      });
    }
    if (['shipped', 'completed'].includes(dbStatus) && order.payment_status !== 'verified') {
      return res.status(400).json({
        message: 'Pesanan tidak dapat diselesaikan sebelum pembayaran diverifikasi.',
      });
    }

    await order.update({ status: dbStatus });
    const user = await User.findByPk(order.user_id);
    const details = await loadOrderDetails(order.order_id);
    res.json({
      message: 'Status pesanan diperbarui',
      order: mapOrderToFe(order, user, details),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }
    const isStaff =
      req.user.role === 'owner' || req.user.role === 'admin' || req.user.role === 'gudang';
    if (Number(order.user_id) !== Number(req.user.id) && !isStaff) {
      await t.rollback();
      return res.status(403).json({ message: 'Tidak boleh membatalkan pesanan ini.' });
    }
    if (!['pending', 'paid'].includes(order.status)) {
      await t.rollback();
      return res.status(400).json({ message: 'Pesanan tidak dapat dibatalkan.' });
    }

    const details = await OrderDetail.findAll({ where: { order_id: order.order_id }, transaction: t });
    for (const d of details) {
      const product = await Product.findByPk(d.product_id, { transaction: t });
      if (!product) continue;
      const oldStock = product.stock;
      const newStock = oldStock + Number(d.quantity);
      await product.update({ stock: newStock }, { transaction: t });
      await StockLog.create(
        {
          product_id: product.product_id,
          old_stock: oldStock,
          new_stock: newStock,
          activity: `Batal pesanan online #${order.order_id}`,
        },
        { transaction: t }
      );
    }

    await order.update({ status: 'cancelled' }, { transaction: t });
    await t.commit();

    const user = await User.findByPk(order.user_id);
    const enriched = await loadOrderDetails(order.order_id);
    res.json({ order: mapOrderToFe(order, user, enriched) });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: error.message });
  }
};
