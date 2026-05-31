const express = require('express');
const router = express.Router();
const { checkout, getHistory } = require('../controllers/transactionController');
const { verifyToken, isStaff } = require('../middleware/authMiddleware');

// Route untuk checkout
router.post('/checkout', verifyToken, isStaff, checkout);
router.get('/history', verifyToken, isStaff, getHistory);

module.exports = router;