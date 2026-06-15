import { Router } from 'express';
import { body } from 'express-validator';
import * as supportController from './support.controller';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();
router.use(authenticate);

router.get('/', supportController.getMyTickets);
router.post('/', [
  body('subject').notEmpty().trim(),
  body('category').notEmpty(),
  body('message').notEmpty().trim(),
], validateRequest, supportController.createTicket);
router.get('/:id', supportController.getTicket);
router.post('/:id/reply', [
  body('message').notEmpty().trim(),
], validateRequest, supportController.replyToTicket);

export default router;
