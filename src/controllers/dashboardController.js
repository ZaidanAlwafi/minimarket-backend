const { Op } = require('sequelize');
const { Order, OrderDetail } = require('../models/OrderModels');
const Product = require('../models/Product');

const SALES_STATUSES = ['shipped', 'completed'];

function dayKey(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

async function orderLines(orderId) {
  const details = await OrderDetail.findAll({ where: { order_id: orderId } });
  const lines = [];
  for (const d of details) {
    const product = await Product.findByPk(d.product_id);
    const qty = Number(d.quantity) || 0;
    const revenue = Number(d.subtotal) || Number(d.price) * qty;
    const buyUnit = Number(product?.harga_beli) || 0;
    lines.push({
      productId: d.product_id,
      name: product?.product_name || `Produk #${d.product_id}`,
      qty,
      revenue,
      cost: buyUnit * qty,
      sellPrice: Number(d.price) || Number(product?.price) || 0,
      buyPrice: buyUnit,
    });
  }
  return lines;
}

exports.getDashboardMetrics = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        status: { [Op.in]: SALES_STATUSES },
        payment_status: 'verified',
      },
      order: [['order_date', 'DESC']],
    });

    const todayKey = dayKey(new Date());
    let salesToday = 0;
    let costToday = 0;
    let txCountToday = 0;
    let salesTotal = 0;
    let costTotal = 0;

    const chartMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      chartMap[dayKey(d)] = { date: dayKey(d), online: 0, total: 0, profit: 0 };
    }

    const productSales = {};

    for (const o of orders) {
      const lines = await orderLines(o.order_id);
      let orderRevenue = 0;
      let orderCost = 0;
      for (const line of lines) {
        orderRevenue += line.revenue;
        orderCost += line.cost;
        const pid = line.productId;
        if (!productSales[pid]) {
          productSales[pid] = {
            productId: pid,
            name: line.name,
            qty: 0,
            total: 0,
            buyPrice: line.buyPrice,
            sellPrice: line.sellPrice,
          };
        }
        productSales[pid].qty += line.qty;
        productSales[pid].total += line.revenue;
      }

      const key = dayKey(o.order_date || new Date());
      const profit = orderRevenue - orderCost;
      salesTotal += orderRevenue;
      costTotal += orderCost;

      if (chartMap[key]) {
        chartMap[key].online += orderRevenue;
        chartMap[key].total += orderRevenue;
        chartMap[key].profit += profit;
      }
      if (key === todayKey) {
        salesToday += orderRevenue;
        costToday += orderCost;
        txCountToday += 1;
      }
    }

    const profitToday = salesToday - costToday;
    const profitTotal = salesTotal - costTotal;

    const chart = Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date));
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const products = await Product.findAll({ limit: 500 });
    const priceSummary = products.slice(0, 8).map((p) => ({
      id: p.product_id,
      name: p.product_name,
      buyPrice: Number(p.harga_beli) || 0,
      sellPrice: Number(p.price) || 0,
    }));

    res.json({
      salesToday,
      costToday,
      profitToday,
      salesTotal,
      costTotal,
      profitTotal,
      txCountToday,
      chart,
      topProducts,
      priceSummary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
