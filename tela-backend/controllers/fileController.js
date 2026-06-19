import File from '../models/File.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import { cloudinary, getPublicFileUrl, isCloudinaryConfigured } from '../utils/uploadMiddleware.js';

// @desc    Get all files for a project
// @route   GET /api/projects/:projectId/files
// @access  Private
export const getFiles = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify access
    if (req.user.role === 'freelancer' && project.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.role === 'client') {
      const client = await Client.findOne({ invitedUser: req.user._id });
      if (!client || client._id.toString() !== project.client.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    const files = await File.find({ project: req.params.projectId })
      .populate('uploadedBy', 'name avatar')
      .populate('milestone', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload file
// @route   POST /api/projects/:projectId/files
// @access  Private
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify access
    let isAuthorized = false;

    if (req.user.role === 'freelancer' && project.freelancer.toString() === req.user._id.toString()) {
      isAuthorized = true;
    }

    if (req.user.role === 'client') {
      const client = await Client.findOne({ invitedUser: req.user._id });
      if (client && client._id.toString() === project.client.toString()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { milestoneId } = req.body;

    const file = await File.create({
      project: req.params.projectId,
      milestone: milestoneId || null,
      uploadedBy: req.user._id,
      fileName: req.file.originalname,
      fileUrl: getPublicFileUrl(req.file),
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });

    const populatedFile = await File.findById(file._id)
      .populate('uploadedBy', 'name avatar')
      .populate('milestone', 'name');

    res.status(201).json({ success: true, data: populatedFile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete file
// @route   DELETE /api/projects/:projectId/files/:id
// @access  Private
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.project.toString() !== req.params.projectId) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const project = await Project.findById(req.params.projectId);

    // Only freelancer or file uploader can delete
    if (req.user.role === 'freelancer' && project.freelancer.toString() !== req.user._id.toString() && file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.role === 'client' && file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete from Cloudinary when applicable
    if (isCloudinaryConfigured() && file.fileUrl?.includes('cloudinary')) {
      const publicId = file.fileUrl.split('/').pop().split('.')[0];
      try {
        await cloudinary.uploader.destroy(`tela/${publicId}`);
      } catch (err) {
        console.log('Cloudinary delete error:', err);
      }
    }

    await file.deleteOne();

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
