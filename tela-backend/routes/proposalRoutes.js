import express from 'express';
import {
  getProposals,
  createProposal,
  getPublicProposal,
  acceptProposal,
  rejectProposal,
  deleteProposal
} from '../controllers/proposalController.js';
import { protect, freelancerOnly, requireSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, freelancerOnly, requireSubscription, getProposals)
  .post(protect, freelancerOnly, requireSubscription, createProposal);

router.get('/public/:slug', getPublicProposal);

router.put('/:id/accept', acceptProposal);
router.put('/:id/reject', rejectProposal);

router.delete('/:id', protect, freelancerOnly, deleteProposal);

export default router;
