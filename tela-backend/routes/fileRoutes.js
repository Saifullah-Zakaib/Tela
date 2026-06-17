import express from 'express';
import {
  getFiles,
  uploadFile,
  deleteFile
} from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../utils/uploadMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, getFiles)
  .post(protect, upload.single('file'), uploadFile);

router.route('/:id')
  .delete(protect, deleteFile);

export default router;
