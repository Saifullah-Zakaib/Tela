import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add client name']
  },
  email: {
    type: String,
    required: [true, 'Please add client email'],
    lowercase: true
  },
  company: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  joinedAt: {
    type: Date
  },
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.model('Client', clientSchema);
