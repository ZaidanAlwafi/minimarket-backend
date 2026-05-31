const Category = require('../models/Category');
const Product = require('../models/Product');
const { mapCategoryToFe } = require('../utils/mappers');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['category_name', 'ASC']] });
    res.json(categories.map(mapCategoryToFe));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
    const cat = await Category.create({
      category_name: name.trim(),
      description: description || '',
    });
    res.status(201).json(mapCategoryToFe(cat));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    const { name, description } = req.body;
    const oldName = cat.category_name;
    await cat.update({
      category_name: name?.trim() || cat.category_name,
      description: description ?? cat.description,
    });
    if (name && name !== oldName) {
      const products = await Product.findAll({ where: { category_id: cat.category_id } });
      /* category stored by id — no product name update needed */
    }
    res.json(mapCategoryToFe(cat));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    await cat.destroy();
    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
