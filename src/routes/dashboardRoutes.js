const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/dashboardController');
const { verifyToken, isOwner } = require('../middleware/authMiddleware');

router.get('/metrics', verifyToken, isOwner, getDashboardMetrics);

module.exports = router;
