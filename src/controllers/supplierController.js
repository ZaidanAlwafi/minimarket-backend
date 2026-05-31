const { Supplier } = require('../models/AdditionalModels');
const { mapSupplierToFe } = require('../utils/mappers');

exports.addSupplier = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const supplier = await Supplier.create({
      supplier_name: name,
      phone: phone || '',
      email: email || '',
      address: address || '',
    });
    res.status(201).json({ message: 'Supplier berhasil ditambahkan', supplier: mapSupplierToFe(supplier) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({ order: [['supplier_id', 'ASC']] });
    res.json(suppliers.map(mapSupplierToFe));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
