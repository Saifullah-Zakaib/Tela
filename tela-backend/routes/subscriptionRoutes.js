import express from 'express';
import {
  startTrial,
  createCheckoutSession,
  confirmCheckout,
  getSubscriptionStatus,
  subscriptionWebhook,
} from '../controllers/subscriptionController.js';
import { protect, freelancerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/webhook', subscriptionWebhook);
router.post('/start-trial', protect, freelancerOnly, startTrial);
router.post('/checkout', protect, freelancerOnly, createCheckoutSession);
router.post('/confirm', protect, freelancerOnly, confirmCheckout);
router.get('/status', protect, freelancerOnly, getSubscriptionStatus);

export default router;
