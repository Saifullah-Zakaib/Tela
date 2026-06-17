import mongoose from 'mongoose';

const feedMessageSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Please add a message']
  },
  attachments: [{
    url: String,
    originalName: String
  }]
}, {
  timestamps: true
});

export default mongoose.model('FeedMessage', feedMessageSchema);
