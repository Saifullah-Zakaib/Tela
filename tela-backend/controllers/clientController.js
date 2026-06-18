import Client from '../models/Client.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Invoice from '../models/Invoice.js';
import crypto from 'crypto';
import sendEmail, { emailTemplates } from '../utils/sendEmail.js';

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private/Freelancer
export const getClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = { freelancer: req.user._id };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(query)
      .populate('invitedUser', 'name email avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Client.countDocuments(query);

    res.json({
      success: true,
      data: clients,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create client
// @route   POST /api/clients
// @access  Private/Freelancer
export const createClient = async (req, res) => {
  try {
    const { name, email, company, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Please provide name and email' });
    }

    const existingClient = await Client.findOne({ 
      freelancer: req.user._id, 
      email 
    });

    if (existingClient) {
      return res.status(400).json({ success: false, message: 'Client with this email already exists' });
    }

    let invitedUser = null;
    const userExists = await User.findOne({ email });

    if (!userExists) {
      const inviteToken = crypto.randomBytes(32).toString('hex');

      invitedUser = await User.create({
        name,
        email,
        password: crypto.randomBytes(20).toString('hex'),
        role: 'client',
        isEmailVerified: false,
        emailVerificationToken: inviteToken
      });

      await sendEmail({
        email: invitedUser.email,
        subject: 'Invitation to Tela',
        html: emailTemplates.clientInvite(name, inviteToken)
      });
    } else {
      invitedUser = userExists._id;
    }

    const client = await Client.create({
      freelancer: req.user._id,
      name,
      email,
      company,
      phone,
      invitedUser: invitedUser._id || invitedUser
    });

    const populatedClient = await Client.findById(client._id).populate('invitedUser', 'name email avatar');

    res.status(201).json({ success: true, data: populatedClient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private/Freelancer
export const getClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      freelancer: req.user._id
    }).populate('invitedUser', 'name email avatar phone');

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const projects = await Project.find({ client: client._id }).sort({ createdAt: -1 });
    const invoices = await Invoice.find({ client: client._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...client.toObject(),
        projects,
        invoices
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private/Freelancer
export const updateClient = async (req, res) => {
  try {
    const { name, company, phone } = req.body;

    const client = await Client.findOne({
      _id: req.params.id,
      freelancer: req.user._id
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    if (name) client.name = name;
    if (company) client.company = company;
    if (phone) client.phone = phone;

    await client.save();

    const populatedClient = await Client.findById(client._id).populate('invitedUser', 'name email avatar');

    res.json({ success: true, data: populatedClient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private/Freelancer
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      freelancer: req.user._id
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Check if client has any projects or invoices
    const hasProjects = await Project.countDocuments({ client: client._id });
    const hasInvoices = await Invoice.countDocuments({ client: client._id });

    if (hasProjects > 0 || hasInvoices > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete client with existing projects or invoices. Archive them first.' 
      });
    }

    // Delete the client record
    await client.deleteOne();

    // Delete the associated user account if it exists and was invited by this freelancer
    if (client.invitedUser) {
      await User.findByIdAndDelete(client.invitedUser);
    }

    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
