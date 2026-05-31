const express = require('express');
const router = express.Router();
const { getStaff, createStaff, updateProfile } = require('../controllers/userController');
const { verifyToken, isOwner } = require('../middleware/authMiddleware');

router.get('/staff', verifyToken, isOwner, getStaff);
router.post('/staff', verifyToken, isOwner, createStaff);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
