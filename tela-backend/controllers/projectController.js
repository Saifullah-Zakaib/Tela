import Project from '../models/Project.js';
import Client from '../models/Client.js';
import Milestone from '../models/Milestone.js';
import FeedMessage from '../models/FeedMessage.js';
import File from '../models/File.js';
import Invoice from '../models/Invoice.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    let query = {};

    if (req.user.role === 'freelancer') {
      query.freelancer = req.user._id;
    } else if (req.user.role === 'client') {
      const client = await Client.findOne({ invitedUser: req.user._id });
      if (!client) {
        return res.json({ success: true, data: [], totalPages: 0, currentPage: page });
      }
      query.client = client._id;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('client', 'name email company')
      .populate('freelancer', 'name email businessName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Project.countDocuments(query);

    res.json({
      success: true,
      data: projects,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private/Freelancer
export const createProject = async (req, res) => {
  try {
    const { clientId, name, description, status, startDate, deadline, budget } = req.body;

    if (!clientId || !name) {
      return res.status(400).json({ success: false, message: 'Please provide client and project name' });
    }

    const client = await Client.findOne({
      _id: clientId,
      freelancer: req.user._id
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    let contractFile = '';
    if (req.file) {
      contractFile = req.file.path;
    }

    const project = await Project.create({
      freelancer: req.user._id,
      client: clientId,
      name,
      description,
      status,
      startDate,
      deadline,
      budget,
      contractFile
    });

    const populatedProject = await Project.findById(project._id)
      .populate('client', 'name email company')
      .populate('freelancer', 'name email businessName');

    res.status(201).json({ success: true, data: populatedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email company phone')
      .populate('freelancer', 'name email businessName businessLogo brandColor');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify access
    if (req.user.role === 'freelancer' && project.freelancer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.role === 'client') {
      const client = await Client.findOne({ invitedUser: req.user._id });
      if (!client || client._id.toString() !== project.client._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    const milestones = await Milestone.find({ project: project._id }).sort({ order: 1 });
    const invoices = await Invoice.find({ project: project._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...project.toObject(),
        milestones,
        invoices
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Freelancer
export const updateProject = async (req, res) => {
  try {
    const { name, description, status, deadline, budget } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      freelancer: req.user._id
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;
    if (deadline) project.deadline = deadline;
    if (budget) project.budget = budget;

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('client', 'name email company')
      .populate('freelancer', 'name email businessName');

    res.json({ success: true, data: populatedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Freelancer
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      freelancer: req.user._id
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await Milestone.deleteMany({ project: project._id });
    await FeedMessage.deleteMany({ project: project._id });
    await File.deleteMany({ project: project._id });
    await Invoice.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project and related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
