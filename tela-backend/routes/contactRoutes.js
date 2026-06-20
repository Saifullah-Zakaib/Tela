import express from 'express';
import { submitContactSales } from '../controllers/contactController.js';

const router = express.Router();

// Public route - no authentication required
router.post('/sales', submitContactSales);

export default router;
