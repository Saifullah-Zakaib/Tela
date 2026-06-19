import Milestone from '../models/Milestone.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import Notification from '../models/Notification.js';
import FeedMessage from '../models/FeedMessage.js';
import sendEmail, { emailTemplates } from '../utils/sendEmail.js';
import { syncProjectStatus } from '../utils/projectStatus.js';
import { isPastDate } from '../utils/dateValidation.js';

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

    if (dueDate && isPastDate(dueDate)) {
      return res.status(400).json({ success: false, message: 'Milestone due date cannot be in the past' });
    }

    const milestone = await Milestone.create({
      project: req.params.projectId,
      name,
      description,
      dueDate,
      amount,
      order
    });

    await syncProjectStatus(req.params.projectId);

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
      if (dueDate) {
        if (isPastDate(dueDate)) {
          return res.status(400).json({ success: false, message: 'Milestone due date cannot be in the past' });
        }
        milestone.dueDate = dueDate;
      }
      if (amount !== undefined) milestone.amount = amount;
      if (order !== undefined) milestone.order = order;

      if (status) {
        const prevStatus = milestone.status;
        milestone.status = status;

        await milestone.save();

        if (status === 'under_review' && prevStatus === 'in_progress') {
          try {
            const client = await Client.findById(project.client);
            if (client?.invitedUser) {
              await Notification.create({
                user: client.invitedUser,
                message: `Milestone "${milestone.name}" is ready for your review`,
                type: 'milestone_review',
                link: `/portal/projects/${project._id}`
              });

              if (client.email) {
                await sendEmail({
                  email: client.email,
                  subject: 'Milestone Ready for Review - Tela',
                html: emailTemplates.milestoneReview(client.name, milestone.name, project.name, project._id)
                });
              }
            }
          } catch (notifyErr) {
            console.error('Milestone review notification failed:', notifyErr);
          }
        }

        await syncProjectStatus(req.params.projectId);
        return res.json({ success: true, data: milestone });
      }

    } else if (req.user.role === 'client') {
      const client = await Client.findOne({ invitedUser: req.user._id });
      if (!client || client._id.toString() !== project.client.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      if (req.body.status === 'approved') {
        if (milestone.status !== 'under_review') {
          return res.status(400).json({ success: false, message: 'Can only approve milestones that are under review' });
        }
        milestone.status = 'approved';

        await milestone.save();

        try {
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
        } catch (notifyErr) {
          console.error('Milestone approval notification failed:', notifyErr);
        }

        await syncProjectStatus(req.params.projectId);
        return res.json({ success: true, data: milestone });
      }

      if (req.body.requestChanges) {
        const { message } = req.body;
        if (!message?.trim()) {
          return res.status(400).json({ success: false, message: 'Please provide feedback for the requested changes' });
        }
        if (milestone.status !== 'under_review') {
          return res.status(400).json({ success: false, message: 'Can only request changes on milestones under review' });
        }

        milestone.status = 'in_progress';
        await milestone.save();

        const feedText = `Revision requested for "${milestone.name}":\n\n${message.trim()}`;
        await FeedMessage.create({
          project: req.params.projectId,
          sender: req.user._id,
          message: feedText,
          attachments: []
        });

        try {
          await Notification.create({
            user: project.freelancer._id,
            message: `Client requested changes on "${milestone.name}"`,
            type: 'milestone_revision',
            link: `/projects/${project._id}`
          });

          await sendEmail({
            email: project.freelancer.email,
            subject: 'Revision Requested - Tela',
            html: emailTemplates.milestoneRevision(
              project.freelancer.name,
              milestone.name,
              project.name,
              message.trim(),
              project._id
            )
          });
        } catch (notifyErr) {
          console.error('Milestone revision notification failed:', notifyErr);
        }

        await syncProjectStatus(req.params.projectId);
        return res.json({ success: true, data: milestone });
      }

      return res.status(403).json({ success: false, message: 'Clients can only approve milestones or request changes' });
    }

    await milestone.save();
    await syncProjectStatus(req.params.projectId);

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
    await syncProjectStatus(req.params.projectId);

    res.json({ success: true, message: 'Milestone deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
