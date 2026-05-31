const express = require('express');
const router = express.Router();
const {
  getMyOrders,
  getAllOrders,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  verifyPayment,
} = require('../controllers/orderController');
const { verifyToken, isStaff, isAdminOrOwner } = require('../middleware/authMiddleware');

router.get('/mine', verifyToken, getMyOrders);
router.get('/', verifyToken, isStaff, getAllOrders);
router.post('/', verifyToken, createOrder);
router.post('/:id/verify-payment', verifyToken, isAdminOrOwner, verifyPayment);
router.patch('/:id/status', verifyToken, isStaff, updateOrderStatus);
router.post('/:id/cancel', verifyToken, cancelOrder);

module.exports = router;
