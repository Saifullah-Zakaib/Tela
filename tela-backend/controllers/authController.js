import crypto from 'crypto';
import User from '../models/User.js';
import Client from '../models/Client.js';
import generateToken from '../utils/generateToken.js';
import sendEmail, { emailTemplates } from '../utils/sendEmail.js';

// @desc    Register freelancer
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      password,
      role: 'freelancer',
      emailVerificationToken,
      isEmailVerified: true // Auto-verify for development
    });

    // Email sending disabled for development
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Verify Your Email - Tela',
    //   html: emailTemplates.verification(user.name, emailVerificationToken)
    // });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Email verification check disabled for development
    // if (!user.isEmailVerified) {
    //   return res.status(401).json({ success: false, message: 'Please verify your email first' });
    // }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          businessName: user.businessName,
          brandColor: user.brandColor
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ emailVerificationToken: req.params.token });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendEmail({
      email: user.email,
      subject: 'Password Reset - Tela',
      html: emailTemplates.resetPassword(user.name, resetToken)
    });

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Invite client
// @route   POST /api/auth/invite-client
// @access  Private/Freelancer
export const inviteClient = async (req, res) => {
  try {
    const { name, email, company, phone } = req.body;

    // Check if client already exists for this freelancer
    const existingClient = await Client.findOne({ 
      freelancer: req.user._id, 
      email 
    });
    
    if (existingClient) {
      return res.status(400).json({ success: false, message: 'You have already invited this client' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');

    const clientUser = await User.create({
      name,
      email,
      password: crypto.randomBytes(20).toString('hex'),
      role: 'client',
      isEmailVerified: false,
      emailVerificationToken: inviteToken
    });

    // Create Client record with pending status
    const client = await Client.create({
      freelancer: req.user._id,
      name,
      email,
      company: company || '',
      phone: phone || '',
      status: 'pending',
      invitedUser: clientUser._id
    });

    // Send email from verified SendGrid email, but replies go to freelancer
    const freelancer = req.user;
    const inviteUrl = `${process.env.CLIENT_URL}/set-password/${inviteToken}`;
    
    try {
      await sendEmail({
        email: clientUser.email,
        subject: `${freelancer.name} invited you to collaborate on Tela`,
        html: emailTemplates.clientInviteFromFreelancer(name, inviteUrl, freelancer.name),
        fromName: freelancer.name,
        fromEmail: process.env.SENDGRID_FROM_EMAIL, // Send from verified email
        replyTo: freelancer.email // Replies go to freelancer's actual email
      });
      
      console.log(`✓ Invitation sent from ${freelancer.email} to ${clientUser.email}`);
      
      const populatedClient = await Client.findById(client._id).populate('invitedUser', 'name email');
      
      res.status(201).json({
        success: true,
        message: 'Client invited successfully. Invitation email sent.',
        data: populatedClient
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      
      // Client is created but email failed
      const populatedClient = await Client.findById(client._id).populate('invitedUser', 'name email');
      
      res.status(201).json({
        success: true,
        message: 'Client created but email failed to send. You can share the invite link manually.',
        data: { 
          client: populatedClient,
          inviteUrl: inviteUrl,
          emailError: emailError.message
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set password for invited client
// @route   POST /api/auth/set-password/:token
// @access  Public
export const setPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findOne({ emailVerificationToken: req.params.token });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.password = password;
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    // Update client status to active
    await Client.findOneAndUpdate(
      { invitedUser: user._id },
      { 
        status: 'active',
        joinedAt: new Date()
      }
    );

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password set successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, email, bio, phone, location, businessName, tagline, brandColor } = req.body;

    const user = await User.findById(req.user._id);

    // Update fields - allow empty strings
    if (name !== undefined) user.name = name;
    if (email !== undefined) {
      // Check if email already exists
      const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = email;
    }
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (businessName !== undefined) user.businessName = businessName;
    if (brandColor !== undefined) user.brandColor = brandColor;

    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Configure email settings (for sending from user's email)
// @route   PUT /api/auth/configure-email
// @access  Private
export const configureEmail = async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword } = req.body;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all email configuration details' 
      });
    }

    const user = await User.findById(req.user._id).select('+emailConfig.smtpPassword');

    user.emailConfig = {
      smtpHost,
      smtpPort: parseInt(smtpPort),
      smtpUser,
      smtpPassword,
      isConfigured: true
    };

    await user.save();

    // Return without sensitive password
    const userResponse = user.toObject();
    delete userResponse.emailConfig.smtpPassword;

    res.json({ 
      success: true, 
      message: 'Email configuration saved successfully',
      data: userResponse 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
