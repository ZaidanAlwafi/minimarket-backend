const { StockLog, Notification } = require('../models/AdditionalModels');
const Product = require('../models/Product');

exports.getStockLogs = async (req, res) => {
  try {
    const logs = await StockLog.findAll({
      include: [{ model: Product, attributes: ['product_id', 'product_name', 'category_id'] }],
      order: [['log_id', 'DESC']],
    });
    res.json(
      logs.map((log) => {
        const row = log.get({ plain: true });
        return {
          id: row.log_id,
          productId: row.product_id,
          productName: row.Product?.product_name || '',
          oldStock: row.old_stock,
          newStock: row.new_stock,
          activity: row.activity,
          createdAt: row.created_at,
        };
      })
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [['notification_id', 'DESC']],
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.readNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.update({ is_read: true }, { where: { notification_id: id } });
    res.json({ message: 'Notifikasi berhasil ditandai telah dibaca' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
