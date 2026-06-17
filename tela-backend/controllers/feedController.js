import FeedMessage from '../models/FeedMessage.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import Notification from '../models/Notification.js';

// @desc    Get all feed messages for a project
// @route   GET /api/projects/:projectId/feed
// @access  Private
export const getFeedMessages = async (req, res) => {
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

    const messages = await FeedMessage.find({ project: req.params.projectId })
      .populate('sender', 'name avatar email')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create feed message
// @route   POST /api/projects/:projectId/feed
// @access  Private
export const createFeedMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    const project = await Project.findById(req.params.projectId).populate('freelancer');
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify access
    let isAuthorized = false;
    let recipientUserId = null;

    if (req.user.role === 'freelancer' && project.freelancer._id.toString() === req.user._id.toString()) {
      isAuthorized = true;
      const client = await Client.findById(project.client);
      recipientUserId = client.invitedUser;
    }

    if (req.user.role === 'client') {
      const client = await Client.findOne({ invitedUser: req.user._id });
      if (client && client._id.toString() === project.client.toString()) {
        isAuthorized = true;
        recipientUserId = project.freelancer._id;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        url: file.path,
        originalName: file.originalname
      }));
    }

    const feedMessage = await FeedMessage.create({
      project: req.params.projectId,
      sender: req.user._id,
      message,
      attachments
    });

    const populatedMessage = await FeedMessage.findById(feedMessage._id)
      .populate('sender', 'name avatar email');

    // Create notification for recipient
    if (recipientUserId) {
      await Notification.create({
        user: recipientUserId,
        message: `New message in project "${project.name}"`,
        type: 'new_message',
        link: `/projects/${project._id}`
      });
    }

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
