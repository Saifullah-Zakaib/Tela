import express from 'express';
import {
  getNotifications,
  markAllRead,
  markRead
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/mark-all-read', protect, markAllRead);
router.put('/:id/read', protect, markRead);

export default router;
