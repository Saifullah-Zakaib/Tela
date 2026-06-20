import express from 'express';
import {
  getNotifications,
  markAllRead,
  markRead
} from '../controllers/notificationController.js';
import { protect, requireSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, requireSubscription, getNotifications);
router.put('/mark-all-read', protect, requireSubscription, markAllRead);
router.put('/:id/read', protect, requireSubscription, markRead);

export default router;
