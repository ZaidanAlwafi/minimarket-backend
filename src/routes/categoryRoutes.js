const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { verifyToken, isOwner } = require('../middleware/authMiddleware');

router.get('/', getAllCategories);
router.post('/', verifyToken, isOwner, createCategory);
router.put('/:id', verifyToken, isOwner, updateCategory);
router.delete('/:id', verifyToken, isOwner, deleteCategory);

module.exports = router;
