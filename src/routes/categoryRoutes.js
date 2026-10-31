import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', authenticate, authorize(ROLES.ADMIN), createCategory);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), updateCategory);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), deleteCategory);

export default router;
