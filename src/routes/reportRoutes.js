const express = require('express');
const router = express.Router();
const { getSalesReport } = require('../controllers/reportController');
const { verifyToken, isStaff } = require('../middleware/authMiddleware');

router.get('/sales', verifyToken, isStaff, getSalesReport);

module.exports = router;
