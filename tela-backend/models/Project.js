import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: [true, 'Please add project name']
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['planning', 'in_progress', 'under_review', 'completed'],
    default: 'planning',
    set: (value) => {
      if (!value) return 'planning';
      return String(value).toLowerCase().replace(/-/g, '_');
    },
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date
  },
  budget: {
    type: Number,
    default: 0
  },
  contractFile: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Project', projectSchema);
