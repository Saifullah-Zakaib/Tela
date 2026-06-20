import express from 'express';
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  inviteClient,
  setPassword,
  getMe,
  updateProfile,
  updatePassword,
  configureEmail
} from '../controllers/authController.js';
import { protect, freelancerOnly, requireSubscription } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/invite-client', protect, freelancerOnly, requireSubscription, inviteClient);
router.post('/set-password/:token', setPassword);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, requireSubscription, updateProfile);
router.put('/update-password', protect, requireSubscription, updatePassword);
router.put('/configure-email', protect, freelancerOnly, requireSubscription, configureEmail);

export default router;
