const express = require('express');
const router = express.Router();
const { getCart, setCartItem, clearCart } = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getCart);
router.put('/item', verifyToken, setCartItem);
router.delete('/', verifyToken, clearCart);

module.exports = router;
