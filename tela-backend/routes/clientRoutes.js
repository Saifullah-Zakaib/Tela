import express from 'express';
import {
  getClients,
  createClient,
  getClient,
  updateClient,
  deleteClient
} from '../controllers/clientController.js';
import { protect, freelancerOnly, requireSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, freelancerOnly, requireSubscription, getClients)
  .post(protect, freelancerOnly, requireSubscription, createClient);

router.route('/:id')
  .get(protect, freelancerOnly, requireSubscription, getClient)
  .put(protect, freelancerOnly, requireSubscription, updateClient)
  .delete(protect, freelancerOnly, requireSubscription, deleteClient);

export default router;
