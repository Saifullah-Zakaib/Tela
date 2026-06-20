import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { hasActiveSubscription } from '../utils/subscriptionAccess.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export const freelancerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'freelancer') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized as freelancer' });
  }
};

export const clientOnly = (req, res, next) => {
  if (req.user && req.user.role === 'client') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized as client' });
  }
};

export const requireSubscription = async (req, res, next) => {
  if (req.user.role !== 'freelancer') {
    return next();
  }

  const user = await User.findById(req.user._id);
  if (!hasActiveSubscription(user)) {
    return res.status(402).json({
      success: false,
      message: 'Active subscription or trial required',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }

  next();
};
