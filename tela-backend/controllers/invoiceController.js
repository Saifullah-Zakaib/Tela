import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import Notification from '../models/Notification.js';
import generateInvoiceNumber from '../utils/generateInvoiceNumber.js';
import sendEmail, { emailTemplates } from '../utils/sendEmail.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, project } = req.query;
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

    if (project) {
      query.project = project;
    }

    const invoices = await Invoice.find(query)
      .populate('client', 'name email company')
      .populate('project', 'name budget')
      .populate('milestone', 'name amount')
      .populate('milestones', 'name amount')
      .populate('freelancer', 'name businessName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: invoices,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private/Freelancer
export const createInvoice = async (req, res) => {
  try {
    const { clientId, projectId, milestoneId, milestoneIds, lineItems, taxPercent, discount, notes, dueDate } = req.body;

    if (!clientId || !lineItems || lineItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide client and line items' });
    }

    const client = await Client.findOne({
      _id: clientId,
      freelancer: req.user._id
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const linkedMilestoneIds = [
      ...(Array.isArray(milestoneIds) ? milestoneIds : []),
      ...(milestoneId ? [milestoneId] : []),
    ].filter((id, index, arr) => arr.indexOf(id) === index);

    for (const mid of linkedMilestoneIds) {
      const existing = await Invoice.findOne({
        $or: [{ milestone: mid }, { milestones: mid }]
      });
      if (existing) {
        const ms = await Milestone.findById(mid).select('name');
        return res.status(400).json({
          success: false,
          message: `Milestone "${ms?.name || 'Unknown'}" already has an invoice (${existing.invoiceNumber})`
        });
      }
    }

    if (projectId) {
      const project = await Project.findOne({ _id: projectId, freelancer: req.user._id });
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
    }

    const invoiceNumber = await generateInvoiceNumber();

    let subtotal = 0;
    const calculatedLineItems = lineItems.map(item => {
      const amount = item.quantity * item.rate;
      subtotal += amount;
      return { ...item, amount };
    });

    const taxAmount = (subtotal * (taxPercent || 0)) / 100;
    const total = subtotal + taxAmount - (discount || 0);

    const invoice = await Invoice.create({
      freelancer: req.user._id,
      client: clientId,
      project: projectId || null,
      milestone: linkedMilestoneIds.length === 1 ? linkedMilestoneIds[0] : null,
      milestones: linkedMilestoneIds,
      invoiceNumber,
      lineItems: calculatedLineItems,
      subtotal,
      taxPercent: taxPercent || 0,
      discount: discount || 0,
      total,
      notes,
      dueDate,
      status: 'draft'
    });

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('client', 'name email company')
      .populate('project', 'name')
      .populate('freelancer', 'name businessName');

    res.status(201).json({ success: true, data: populatedInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name email company phone')
      .populate('project', 'name')
      .populate('freelancer', 'name email businessName businessLogo brandColor phone location');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Verify access
    if (req.user.role === 'freelancer' && invoice.freelancer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.role === 'client') {
      const client = await Client.findOne({ invitedUser: req.user._id });
      if (!client || client._id.toString() !== invoice.client._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private/Freelancer
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      freelancer: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Can only update draft invoices' });
    }

    const { lineItems, taxPercent, discount, notes, dueDate } = req.body;

    if (lineItems) {
      let subtotal = 0;
      const calculatedLineItems = lineItems.map(item => {
        const amount = item.quantity * item.rate;
        subtotal += amount;
        return { ...item, amount };
      });

      const taxAmount = (subtotal * (taxPercent || invoice.taxPercent)) / 100;
      const total = subtotal + taxAmount - (discount || invoice.discount);

      invoice.lineItems = calculatedLineItems;
      invoice.subtotal = subtotal;
      invoice.total = total;
    }

    if (taxPercent !== undefined) invoice.taxPercent = taxPercent;
    if (discount !== undefined) invoice.discount = discount;
    if (notes) invoice.notes = notes;
    if (dueDate) invoice.dueDate = dueDate;

    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('client', 'name email company')
      .populate('project', 'name')
      .populate('freelancer', 'name businessName');

    res.json({ success: true, data: populatedInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send invoice
// @route   PUT /api/invoices/:id/send
// @access  Private/Freelancer
export const sendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      freelancer: req.user._id
    }).populate('client', 'name email');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.status = 'sent';
    await invoice.save();

    await sendEmail({
      email: invoice.client.email,
      subject: `Invoice ${invoice.invoiceNumber} - Tela`,
      html: emailTemplates.invoiceSent(invoice.client.name, invoice.invoiceNumber, invoice.total, invoice._id)
    });

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Pay invoice
// @route   POST /api/invoices/:id/pay
// @access  Private/Client
export const payInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('freelancer', 'businessName');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const client = await Client.findOne({ invitedUser: req.user._id });
    if (!client || client._id.toString() !== invoice.client.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(invoice.total * 100),
      currency: 'usd',
      metadata: {
        invoiceId: invoice._id.toString()
      }
    });

    invoice.stripePaymentIntentId = paymentIntent.id;
    await invoice.save();

    res.json({ success: true, data: { clientSecret: paymentIntent.client_secret } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Stripe webhook
// @route   POST /api/invoices/webhook
// @access  Public
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const invoiceId = paymentIntent.metadata.invoiceId;

    const invoice = await Invoice.findById(invoiceId).populate('freelancer', 'name email');

    if (invoice) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      await invoice.save();

      await Notification.create({
        user: invoice.freelancer._id,
        message: `Invoice ${invoice.invoiceNumber} has been paid`,
        type: 'invoice_paid',
        link: `/invoices/${invoice._id}`
      });
    }
  }

  res.json({ received: true });
};

// @desc    Check overdue invoices
// @route   GET /api/invoices/check-overdue
// @access  Internal/Cron
export const checkOverdueInvoices = async (req, res) => {
  try {
    const overdueInvoices = await Invoice.find({
      status: 'sent',
      dueDate: { $lt: new Date() }
    }).populate('client', 'name email')
      .populate('freelancer', 'name email');

    let updatedCount = 0;

    for (const invoice of overdueInvoices) {
      invoice.status = 'overdue';
      await invoice.save();

      await sendEmail({
        email: invoice.client.email,
        subject: `Invoice Overdue Reminder - ${invoice.invoiceNumber}`,
        html: emailTemplates.invoiceOverdue(invoice.client.name, invoice.invoiceNumber, invoice.total)
      });

      await Notification.create({
        user: invoice.freelancer._id,
        message: `Invoice ${invoice.invoiceNumber} is now overdue`,
        type: 'invoice_overdue',
        link: `/invoices/${invoice._id}`
      });

      updatedCount++;
    }

    res.json({ success: true, message: `${updatedCount} invoices marked as overdue` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
