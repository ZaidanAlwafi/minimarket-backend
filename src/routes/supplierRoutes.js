const express = require('express');
const router = express.Router();
const { addSupplier, getAllSuppliers } = require('../controllers/supplierController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllSuppliers);
router.post('/', verifyToken, addSupplier);

module.exports = router;