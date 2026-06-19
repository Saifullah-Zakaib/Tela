import { nanoid } from 'nanoid';
import { getClientUrl } from '../config/clientUrl.js';
import Proposal from '../models/Proposal.js';
import Client from '../models/Client.js';
import Notification from '../models/Notification.js';
import sendEmail, { emailTemplates } from '../utils/sendEmail.js';

// @desc    Get all proposals
// @route   GET /api/proposals
// @access  Private/Freelancer
export const getProposals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const proposals = await Proposal.find({ freelancer: req.user._id })
      .populate('client', 'name email company')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Proposal.countDocuments({ freelancer: req.user._id });

    res.json({
      success: true,
      data: proposals,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create proposal
// @route   POST /api/proposals
// @access  Private/Freelancer
export const createProposal = async (req, res) => {
  try {
    const { clientId, title, description, deliverables, timeline, price, paymentTerms } = req.body;

    if (!clientId || !title) {
      return res.status(400).json({ success: false, message: 'Please provide client and title' });
    }

    const client = await Client.findOne({
      _id: clientId,
      freelancer: req.user._id
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const publicSlug = nanoid(10);

    const proposal = await Proposal.create({
      freelancer: req.user._id,
      client: clientId,
      title,
      description,
      deliverables,
      timeline,
      price,
      paymentTerms,
      publicSlug
    });

    const populatedProposal = await Proposal.findById(proposal._id).populate('client', 'name email company');

    const shareableLink = `${getClientUrl()}/proposals/public/${publicSlug}`;

    res.status(201).json({
      success: true,
      data: {
        ...populatedProposal.toObject(),
        shareableLink
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public proposal
// @route   GET /api/proposals/public/:slug
// @access  Public
export const getPublicProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ publicSlug: req.params.slug })
      .populate('freelancer', 'name email businessName businessLogo brandColor phone location bio')
      .populate('client', 'name email company');

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    res.json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept proposal
// @route   PUT /api/proposals/:id/accept
// @access  Public (with slug) or Private (client)
export const acceptProposal = async (req, res) => {
  try {
    const { slug } = req.query;
    let proposal;

    if (slug) {
      proposal = await Proposal.findOne({ 
        _id: req.params.id, 
        publicSlug: slug 
      }).populate('freelancer', 'name email');
    } else if (req.user && req.user.role === 'client') {
      const client = await Client.findOne({ invitedUser: req.user._id });
      if (!client) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      proposal = await Proposal.findOne({
        _id: req.params.id,
        client: client._id
      }).populate('freelancer', 'name email');
    }

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    proposal.status = 'accepted';
    await proposal.save();

    await Notification.create({
      user: proposal.freelancer._id,
      message: `Proposal "${proposal.title}" has been accepted`,
      type: 'proposal_accepted',
      link: `/proposals/${proposal._id}`
    });

    await sendEmail({
      email: proposal.freelancer.email,
      subject: 'Proposal Accepted - Tela',
      html: emailTemplates.proposalAccepted(proposal.freelancer.name, proposal.title)
    });

    res.json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject proposal
// @route   PUT /api/proposals/:id/reject
// @access  Public (with slug) or Private (client)
export const rejectProposal = async (req, res) => {
  try {
    const { slug } = req.query;
    let proposal;

    if (slug) {
      proposal = await Proposal.findOne({ 
        _id: req.params.id, 
        publicSlug: slug 
      });
    } else if (req.user && req.user.role === 'client') {
      const client = await Client.findOne({ invitedUser: req.user._id });
      if (!client) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      proposal = await Proposal.findOne({
        _id: req.params.id,
        client: client._id
      });
    }

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    proposal.status = 'rejected';
    await proposal.save();

    res.json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
