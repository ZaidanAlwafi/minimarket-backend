const express = require('express');
const router = express.Router();
const { registerCustomer, login, me } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', registerCustomer);
router.post('/login', login);
router.get('/me', verifyToken, me);

module.exports = router;
