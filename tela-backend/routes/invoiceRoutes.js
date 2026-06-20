import express from 'express';
import {
  getInvoices,
  createInvoice,
  getInvoice,
  updateInvoice,
  sendInvoice,
  payInvoice,
  stripeWebhook,
  checkOverdueInvoices
} from '../controllers/invoiceController.js';
import { protect, freelancerOnly, clientOnly, requireSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
router.get('/check-overdue', checkOverdueInvoices);

router.route('/')
  .get(protect, requireSubscription, getInvoices)
  .post(protect, freelancerOnly, requireSubscription, createInvoice);

router.route('/:id')
  .get(protect, requireSubscription, getInvoice)
  .put(protect, freelancerOnly, requireSubscription, updateInvoice);

router.put('/:id/send', protect, freelancerOnly, requireSubscription, sendInvoice);
router.post('/:id/pay', protect, clientOnly, requireSubscription, payInvoice);

export default router;
