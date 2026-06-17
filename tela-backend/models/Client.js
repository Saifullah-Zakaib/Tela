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
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.model('Client', clientSchema);
