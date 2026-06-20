import express from 'express';
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone
} from '../controllers/milestoneController.js';
import { protect, freelancerOnly, requireSubscription } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, requireSubscription, getMilestones)
  .post(protect, freelancerOnly, requireSubscription, createMilestone);

router.route('/:id')
  .put(protect, requireSubscription, updateMilestone)
  .delete(protect, freelancerOnly, requireSubscription, deleteMilestone);

export default router;
