import express from 'express';
import {
  getProposals,
  createProposal,
  getPublicProposal,
  acceptProposal,
  rejectProposal
} from '../controllers/proposalController.js';
import { protect, freelancerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, freelancerOnly, getProposals)
  .post(protect, freelancerOnly, createProposal);

router.get('/public/:slug', getPublicProposal);

router.put('/:id/accept', acceptProposal);
router.put('/:id/reject', rejectProposal);

export default router;
