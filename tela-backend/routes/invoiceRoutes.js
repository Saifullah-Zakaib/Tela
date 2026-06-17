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
import { protect, freelancerOnly, clientOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
router.get('/check-overdue', checkOverdueInvoices);

router.route('/')
  .get(protect, getInvoices)
  .post(protect, freelancerOnly, createInvoice);

router.route('/:id')
  .get(protect, getInvoice)
  .put(protect, freelancerOnly, updateInvoice);

router.put('/:id/send', protect, freelancerOnly, sendInvoice);
router.post('/:id/pay', protect, clientOnly, payInvoice);

export default router;
