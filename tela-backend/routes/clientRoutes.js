import express from 'express';
import {
  getClients,
  createClient,
  getClient,
  updateClient,
  deleteClient
} from '../controllers/clientController.js';
import { protect, freelancerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, freelancerOnly, getClients)
  .post(protect, freelancerOnly, createClient);

router.route('/:id')
  .get(protect, freelancerOnly, getClient)
  .put(protect, freelancerOnly, updateClient)
  .delete(protect, freelancerOnly, deleteClient);

export default router;
