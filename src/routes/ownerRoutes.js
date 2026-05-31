const express = require('express');
const router = express.Router();
const { getStockLogs, getNotifications, readNotification } = require('../controllers/ownerController');
const { verifyToken, isOwner } = require('../middleware/authMiddleware');

// Semua rute di bawah ini wajib Login DAN harus bermutu sebagai Owner
router.get('/logs', verifyToken, isOwner, getStockLogs);
router.get('/notifications', verifyToken, isOwner, getNotifications);
router.put('/notifications/:id/read', verifyToken, isOwner, readNotification);

module.exports = router;