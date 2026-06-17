import express from 'express';
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';
import { protect, freelancerOnly } from '../middleware/authMiddleware.js';
import { upload } from '../utils/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getProjects)
  .post(protect, freelancerOnly, upload.single('contract'), createProject);

router.route('/:id')
  .get(protect, getProject)
  .put(protect, freelancerOnly, updateProject)
  .delete(protect, freelancerOnly, deleteProject);

export default router;
