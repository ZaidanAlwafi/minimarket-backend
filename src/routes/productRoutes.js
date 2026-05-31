const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');
const { uploadProductImage } = require('../controllers/uploadController');
const { verifyToken, isOwner } = require('../middleware/authMiddleware');

router.get('/', getAllProducts);
router.post('/upload-image', verifyToken, isOwner, uploadProductImage);
router.post('/', verifyToken, createProduct);
router.put('/:id', verifyToken, updateProduct);
router.delete('/:id', verifyToken, deleteProduct);

module.exports = router;