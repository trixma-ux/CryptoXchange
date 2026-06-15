import { Router } from 'express';
import * as notifController from './notifications.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', notifController.getNotifications);
router.patch('/:id/read', notifController.markAsRead);

export default router;
