const Product = require('../models/Product');
const Category = require('../models/Category');
const { Supplier } = require('../models/AdditionalModels');
const { mapProductToFe } = require('../utils/mappers');

async function productsWithCategories() {
  const products = await Product.findAll();
  const categories = await Category.findAll();
  const suppliers = await Supplier.findAll();
  const catMap = Object.fromEntries(
    categories.map((c) => [c.category_id, c.category_name])
  );
  const supMap = Object.fromEntries(
    suppliers.map((s) => [s.supplier_id, s.supplier_name])
  );
  return products.map((p) =>
    mapProductToFe(p, catMap[p.category_id], supMap[p.supplier_id])
  );
}

exports.getAllProducts = async (req, res) => {
  try {
    const products = await productsWithCategories();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      buyPrice,
      hargaBeli,
      stock,
      category,
      categoryId,
      image,
      description,
      minStock,
      supplierId,
    } = req.body;
    const imagePath = image ? String(image).trim() : '';
    let category_id = categoryId;
    if (!category_id && category) {
      const cat = await Category.findOne({ where: { category_name: category } });
      category_id = cat?.category_id || null;
    }
    const harga_beli = Number(hargaBeli ?? buyPrice ?? 0) || 0;
    const product = await Product.create({
      product_name: name,
      price: price ?? 0,
      harga_beli,
      stock: stock ?? 0,
      category_id,
      supplier_id: supplierId || null,
      minimum_stock: minStock ?? 10,
      image: imagePath,
      description: description || '',
    });
    const catName = category_id
      ? (await Category.findByPk(category_id))?.category_name
      : category || '';
    const supName = product.supplier_id
      ? (await Supplier.findByPk(product.supplier_id))?.supplier_name
      : '';
    res.status(201).json(mapProductToFe(product, catName, supName));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });

    const {
      name,
      price,
      buyPrice,
      hargaBeli,
      stock,
      category,
      categoryId,
      image,
      description,
      minStock,
      supplierId,
    } = req.body;
    const imagePath = image ? String(image).trim() : '';
    let category_id = categoryId ?? product.category_id;
    if (category) {
      const cat = await Category.findOne({ where: { category_name: category } });
      if (cat) category_id = cat.category_id;
    }

    const nextBuy =
      hargaBeli !== undefined || buyPrice !== undefined
        ? Number(hargaBeli ?? buyPrice) || 0
        : product.harga_beli;

    await product.update({
      product_name: name ?? product.product_name,
      price: price ?? product.price,
      harga_beli: nextBuy,
      stock: stock ?? product.stock,
      category_id,
      supplier_id: supplierId !== undefined ? supplierId || null : product.supplier_id,
      minimum_stock: minStock ?? product.minimum_stock,
      image: image !== undefined && image !== null ? imagePath : product.image,
      description: description ?? product.description,
    });

    const cat = category_id ? await Category.findByPk(category_id) : null;
    const sup = product.supplier_id ? await Supplier.findByPk(product.supplier_id) : null;
    res.json({
      message: 'Produk berhasil diupdate',
      product: mapProductToFe(product, cat?.category_name, sup?.supplier_name),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    await product.destroy();
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
