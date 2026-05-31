const express = require('express');
const router = express.Router();
const {
  stockIn,
  stockReturn,
  listStockIn,
  listReturns,
  getLowStock,
} = require('../controllers/stockController');
const { verifyToken, isStaff } = require('../middleware/authMiddleware');

router.get('/low', verifyToken, getLowStock);
router.get('/in', verifyToken, isStaff, listStockIn);
router.get('/returns', verifyToken, isStaff, listReturns);
router.post('/in', verifyToken, isStaff, stockIn);
router.post('/return', verifyToken, isStaff, stockReturn);

module.exports = router;
