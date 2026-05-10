// backend/src/routes/users.ts
import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getUsers, createUser } from '../controllers/userController';

const router = Router();

router.use(authenticate);

router.get('/', requireAdmin, getUsers);
router.post('/', requireAdmin, createUser);

export default router;