const sequelize = require('../config/database');
const Product = require('../models/Product');
const { Supplier, StockLog, Notification } = require('../models/AdditionalModels');
const { StockIn, StockReturn } = require('../models/StockMovement');
const { mapProductToFe } = require('../utils/mappers');

async function adjustProductStock(productId, delta, activity, t) {
  const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!product) throw new Error('Produk tidak ditemukan');

  const oldStock = Number(product.stock) || 0;
  const newStock = oldStock + delta;
  if (newStock < 0) throw new Error(`Stok ${product.product_name} tidak mencukupi (sisa ${oldStock})`);

  await product.update({ stock: newStock }, { transaction: t });
  await StockLog.create(
    {
      product_id: product.product_id,
      old_stock: oldStock,
      new_stock: newStock,
      activity,
    },
    { transaction: t }
  );

  const min = Number(product.minimum_stock) || 10;
  if (newStock < min) {
    await Notification.create(
      {
        title: 'Peringatan Stok',
        message: `Stok ${product.product_name} menipis! Sisa: ${newStock} (min: ${min})`,
        is_read: false,
      },
      { transaction: t }
    );
  }

  return { product, oldStock, newStock };
}

exports.stockIn = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { productId, supplierId, quantity, note } = req.body;
    const qty = Number(quantity);
    if (!productId || !Number.isFinite(qty) || qty < 1) {
      await t.rollback();
      return res.status(400).json({ message: 'Produk dan jumlah wajib valid.' });
    }

    const { product } = await adjustProductStock(
      productId,
      qty,
      `Barang masuk (+${qty}) oleh ${req.user.name || 'Staff'}${note ? ` — ${note}` : ''}`,
      t
    );

    const row = await StockIn.create(
      {
        product_id: productId,
        supplier_id: supplierId || null,
        quantity: qty,
        date_in: new Date(),
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json({
      message: `Stok ${product.product_name} bertambah ${qty}`,
      stockIn: row,
      product: mapProductToFe(product),
    });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: error.message });
  }
};

exports.stockReturn = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { productId, supplierId, quantity, reason, adjustStock = true } = req.body;
    const qty = Number(quantity);
    if (!productId || !Number.isFinite(qty) || qty < 1) {
      await t.rollback();
      return res.status(400).json({ message: 'Produk dan jumlah wajib valid.' });
    }

    let product;
    if (adjustStock !== false) {
      const result = await adjustProductStock(
        productId,
        -qty,
        `Retur barang (-${qty}) — ${reason || 'Tanpa alasan'}`,
        t
      );
      product = result.product;
    } else {
      product = await Product.findByPk(productId, { transaction: t });
    }

    const row = await StockReturn.create(
      {
        product_id: productId,
        supplier_id: supplierId || null,
        quantity: qty,
        reason: reason || '',
        return_date: new Date(),
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json({
      message: adjustStock !== false ? `Stok dikurangi ${qty} (retur)` : 'Retur dicatat',
      stockReturn: row,
      product: product ? mapProductToFe(product) : null,
    });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: error.message });
  }
};

exports.listStockIn = async (req, res) => {
  try {
    const rows = await StockIn.findAll({ order: [['stockin_id', 'DESC']], limit: 200 });
    const result = [];
    for (const row of rows) {
      const p = await Product.findByPk(row.product_id);
      const s = row.supplier_id ? await Supplier.findByPk(row.supplier_id) : null;
      result.push({
        id: row.stockin_id,
        productId: row.product_id,
        productName: p?.product_name || '',
        supplierId: row.supplier_id,
        supplierName: s?.supplier_name || '',
        qty: row.quantity,
        date: row.date_in ? new Date(row.date_in).toLocaleString('id-ID') : '',
        ts: row.date_in ? new Date(row.date_in).getTime() : Date.now(),
      });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listReturns = async (req, res) => {
  try {
    const rows = await StockReturn.findAll({ order: [['return_id', 'DESC']], limit: 200 });
    const result = [];
    for (const row of rows) {
      const p = await Product.findByPk(row.product_id);
      const s = row.supplier_id ? await Supplier.findByPk(row.supplier_id) : null;
      result.push({
        id: row.return_id,
        noRetur: `RET-${String(row.return_id).padStart(4, '0')}`,
        productId: row.product_id,
        productName: p?.product_name || '',
        supplierId: row.supplier_id,
        supplierName: s?.supplier_name || '',
        qty: row.quantity,
        reason: row.reason || '',
        date: row.return_date ? new Date(row.return_date).toLocaleDateString('id-ID') : '',
        ts: row.return_date ? new Date(row.return_date).getTime() : Date.now(),
        status: 'Diproses',
        adjustStock: true,
      });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const Category = require('../models/Category');
    const products = await Product.findAll();
    const categories = await Category.findAll();
    const catMap = Object.fromEntries(categories.map((c) => [c.category_id, c.category_name]));
    const low = products
      .filter((p) => {
        const min = Number(p.minimum_stock) || 10;
        return Number(p.stock) < min;
      })
      .map((p) => mapProductToFe(p, catMap[p.category_id]));
    res.json(low);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
