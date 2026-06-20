import express from 'express';
import {
  getFiles,
  uploadFile,
  deleteFile
} from '../controllers/fileController.js';
import { protect, requireSubscription } from '../middleware/authMiddleware.js';
import { upload } from '../utils/uploadMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, requireSubscription, getFiles)
  .post(protect, requireSubscription, upload.single('file'), uploadFile);

router.route('/:id')
  .delete(protect, requireSubscription, deleteFile);

export default router;
