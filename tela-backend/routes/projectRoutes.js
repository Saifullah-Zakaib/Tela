import express from 'express';
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';
import { protect, freelancerOnly, requireSubscription } from '../middleware/authMiddleware.js';
import { upload } from '../utils/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, requireSubscription, getProjects)
  .post(protect, freelancerOnly, requireSubscription, upload.single('contract'), createProject);

router.route('/:id')
  .get(protect, requireSubscription, getProject)
  .put(protect, freelancerOnly, requireSubscription, updateProject)
  .delete(protect, freelancerOnly, requireSubscription, deleteProject);

export default router;
