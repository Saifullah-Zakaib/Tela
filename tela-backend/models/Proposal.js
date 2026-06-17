import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: [true, 'Please add proposal title']
  },
  description: {
    type: String,
    default: ''
  },
  deliverables: [{
    type: String
  }],
  timeline: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  publicSlug: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Proposal', proposalSchema);
