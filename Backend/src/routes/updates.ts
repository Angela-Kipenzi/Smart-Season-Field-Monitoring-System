// backend/src/routes/updates.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createUpdate, getFieldUpdates, getAllUpdates } from '../controllers/updateController';

const router = Router();

router.use(authenticate);

router.post('/', createUpdate);
router.get('/field/:fieldId', getFieldUpdates);
router.get('/all', getAllUpdates); // Admin only (checked in controller)

export default router;