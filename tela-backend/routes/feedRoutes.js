import express from 'express';
import {
  getFeedMessages,
  createFeedMessage
} from '../controllers/feedController.js';
import { protect, requireSubscription } from '../middleware/authMiddleware.js';
import { upload } from '../utils/uploadMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, requireSubscription, getFeedMessages)
  .post(protect, requireSubscription, upload.array('attachments', 5), createFeedMessage);

export default router;
