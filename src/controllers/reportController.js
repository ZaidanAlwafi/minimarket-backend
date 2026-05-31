const { Op } = require('sequelize');
const { Order, OrderDetail } = require('../models/OrderModels');
const Product = require('../models/Product');
const User = require('../models/User');

const DELIVERED_STATUSES = ['shipped', 'completed'];

function dayKey(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

exports.getSalesReport = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { status: { [Op.in]: DELIVERED_STATUSES } },
      order: [['order_date', 'DESC']],
    });

    const todayKey = dayKey(new Date());
    let salesToday = 0;
    let txCountToday = 0;

    const chartMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      chartMap[dayKey(d)] = { date: dayKey(d), online: 0, total: 0 };
    }

    const productSales = {};

    const salesRecords = [];

    for (const o of orders) {
      const total = Number(o.total_price) || 0;
      const key = dayKey(o.order_date || new Date());
      if (chartMap[key]) {
        chartMap[key].online += total;
        chartMap[key].total += total;
      }
      if (key === todayKey) {
        salesToday += total;
        txCountToday += 1;
      }

      const user = await User.findByPk(o.user_id);
      const details = await OrderDetail.findAll({ where: { order_id: o.order_id } });
      const items = [];
      for (const d of details) {
        const prod = await Product.findByPk(d.product_id);
        const name = prod?.product_name || `Produk #${d.product_id}`;
        const qty = Number(d.quantity) || 0;
        items.push({ name, qty, price: Number(d.price) || 0 });
        const pid = d.product_id;
        if (!productSales[pid]) productSales[pid] = { productId: pid, name, qty: 0, total: 0 };
        productSales[pid].qty += qty;
        productSales[pid].total += Number(d.subtotal) || 0;
      }

      salesRecords.push({
        id: `ON-${o.order_id}`,
        channel: 'online',
        orderId: `#ORD-${String(o.order_id).padStart(3, '0')}`,
        customer: user?.username || '',
        total,
        date: o.order_date ? new Date(o.order_date).toLocaleString('id-ID') : '',
        ts: o.order_date ? new Date(o.order_date).getTime() : Date.now(),
        status: o.status,
        items,
      });
    }

    const chart = Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date));
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    salesRecords.sort((a, b) => (b.ts || 0) - (a.ts || 0));

    res.json({
      salesToday,
      txCountToday,
      chart,
      topProducts,
      salesRecords: salesRecords.slice(0, 100),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
