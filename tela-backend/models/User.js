import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['freelancer', 'client'],
    default: 'client'
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  businessName: {
    type: String,
    default: ''
  },
  businessLogo: {
    type: String,
    default: ''
  },
  brandColor: {
    type: String,
    default: '#3B82F6'
  },
  // Email SMTP Configuration (for freelancers to send emails from their account)
  emailConfig: {
    smtpHost: {
      type: String,
      default: ''
    },
    smtpPort: {
      type: Number,
      default: 587
    },
    smtpUser: {
      type: String,
      default: ''
    },
    smtpPassword: {
      type: String,
      default: '',
      select: false // Don't return in queries by default
    },
    isConfigured: {
      type: Boolean,
      default: false
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  subscriptionPlan: {
    type: String,
    enum: ['none', 'trial', 'pro', 'custom'],
    default: 'none',
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'active', 'canceled', 'past_due'],
    default: 'none',
  },
  trialStartedAt: Date,
  trialEndsAt: Date,
  subscriptionEndsAt: Date,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
