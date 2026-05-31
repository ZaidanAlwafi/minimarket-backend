const { Cart } = require('../models/OrderModels');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { mapProductToFe } = require('../utils/mappers');

async function getCartItems(userId) {
  const rows = await Cart.findAll({ where: { user_id: userId } });
  const categories = await Category.findAll();
  const catMap = Object.fromEntries(categories.map((c) => [c.category_id, c.category_name]));
  const items = [];
  for (const row of rows) {
    const product = await Product.findByPk(row.product_id);
    if (!product) continue;
    const mapped = mapProductToFe(product, catMap[product.category_id]);
    items.push({
      productId: mapped.id,
      name: mapped.name,
      price: mapped.price,
      qty: row.quantity,
      image: mapped.image,
      description: mapped.description,
      category: mapped.category,
    });
  }
  return items;
}

exports.getCart = async (req, res) => {
  try {
    const items = await getCartItems(req.user.id);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.setCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, qty } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });

    const existing = await Cart.findOne({
      where: { user_id: userId, product_id: productId },
    });

    const quantity = Math.max(0, Number(qty) || 0);
    if (quantity === 0) {
      if (existing) await existing.destroy();
    } else if (existing) {
      await existing.update({ quantity });
    } else {
      await Cart.create({
        user_id: userId,
        product_id: productId,
        quantity,
        created_at: new Date(),
      });
    }

    const items = await getCartItems(userId);
    res.json({ items });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.destroy({ where: { user_id: req.user.id } });
    res.json({ items: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
