import Milestone from '../models/Milestone.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import Notification from '../models/Notification.js';
import sendEmail, { emailTemplates } from '../utils/sendEmail.js';
import User from '../models/User.js';

// @desc    Get all milestones for a project
// @route   GET /api/projects/:projectId/milestones
// @access  Private
export const getMilestones = async (req, res) => {
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

    const milestones = await Milestone.find({ project: req.params.projectId }).sort({ order: 1 });

    res.json({ success: true, data: milestones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create milestone
// @route   POST /api/projects/:projectId/milestones
// @access  Private/Freelancer
export const createMilestone = async (req, res) => {
  try {
    const { name, description, dueDate, amount, order } = req.body;

    const project = await Project.findOne({
      _id: req.params.projectId,
      freelancer: req.user._id
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide milestone name' });
    }

    const milestone = await Milestone.create({
      project: req.params.projectId,
      name,
      description,
      dueDate,
      amount,
      order
    });

    res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update milestone
// @route   PUT /api/projects/:projectId/milestones/:id
// @access  Private
export const updateMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);

    if (!milestone || milestone.project.toString() !== req.params.projectId) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const project = await Project.findById(req.params.projectId).populate('freelancer');

    if (req.user.role === 'freelancer') {
      if (project.freelancer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const { name, description, dueDate, amount, order, status } = req.body;
      if (name) milestone.name = name;
      if (description) milestone.description = description;
      if (dueDate) milestone.dueDate = dueDate;
      if (amount !== undefined) milestone.amount = amount;
      if (order !== undefined) milestone.order = order;
      if (status) milestone.status = status;

    } else if (req.user.role === 'client') {
      const client = await Client.findOne({ invitedUser: req.user._id });
      if (!client || client._id.toString() !== project.client.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      if (req.body.status === 'approved') {
        milestone.status = 'approved';

        await Notification.create({
          user: project.freelancer._id,
          message: `Milestone "${milestone.name}" has been approved`,
          type: 'milestone_approved',
          link: `/projects/${project._id}`
        });

        await sendEmail({
          email: project.freelancer.email,
          subject: 'Milestone Approved - Tela',
          html: emailTemplates.milestoneApproved(project.freelancer.name, milestone.name, project.name)
        });
      } else {
        return res.status(403).json({ success: false, message: 'Clients can only approve milestones' });
      }
    }

    await milestone.save();

    res.json({ success: true, data: milestone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete milestone
// @route   DELETE /api/projects/:projectId/milestones/:id
// @access  Private/Freelancer
export const deleteMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);

    if (!milestone || milestone.project.toString() !== req.params.projectId) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const project = await Project.findOne({
      _id: req.params.projectId,
      freelancer: req.user._id
    });

    if (!project) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await milestone.deleteOne();

    res.json({ success: true, message: 'Milestone deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
