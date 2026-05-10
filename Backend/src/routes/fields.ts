// backend/src/routes/fields.ts
import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  createField,
  getFields,
  getField,
  updateField,
  deleteField,
  assignAgent,
} from '../controllers/fieldController';

const router = Router();

// All field routes require authentication
router.use(authenticate);

// Admin only routes
router.post('/', requireAdmin, createField);
router.put('/:id', requireAdmin, updateField);
router.delete('/:id', requireAdmin, deleteField);
router.patch('/:id/assign', requireAdmin, assignAgent);

// Accessible by both roles (with data filtering)
router.get('/', getFields);
router.get('/:id', getField);

export default router;