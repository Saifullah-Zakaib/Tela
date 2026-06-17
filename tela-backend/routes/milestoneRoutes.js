import express from 'express';
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone
} from '../controllers/milestoneController.js';
import { protect, freelancerOnly } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, getMilestones)
  .post(protect, freelancerOnly, createMilestone);

router.route('/:id')
  .put(protect, updateMilestone)
  .delete(protect, freelancerOnly, deleteMilestone);

export default router;
