import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  },
  milestones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  }],
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  lineItems: [{
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number
  }],
  subtotal: {
    type: Number,
    default: 0
  },
  taxPercent: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue'],
    default: 'draft'
  },
  dueDate: {
    type: Date
  },
  paidAt: {
    type: Date
  },
  stripePaymentIntentId: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Invoice', invoiceSchema);
