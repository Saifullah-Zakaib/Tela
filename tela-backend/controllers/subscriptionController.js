import Stripe from 'stripe';
import User from '../models/User.js';
import { getClientUrl } from '../config/clientUrl.js';
import { hasActiveSubscription, serializeSubscription } from '../utils/subscriptionAccess.js';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey && !stripeKey.includes('your_stripe') ? new Stripe(stripeKey) : null;

// @desc    Start 14-day free trial
// @route   POST /api/subscriptions/start-trial
// @access  Private (freelancer)
export const startTrial = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.role !== 'freelancer') {
      return res.status(403).json({ success: false, message: 'Only freelancers can start a trial' });
    }

    if (hasActiveSubscription(user)) {
      return res.json({
        success: true,
        data: { user: { ...user.toObject(), ...serializeSubscription(user) } },
        message: 'You already have active access',
      });
    }

    if (user.trialStartedAt) {
      return res.status(400).json({
        success: false,
        message: 'Your free trial has already been used. Choose a paid plan to continue.',
      });
    }

    const now = new Date();
    const trialEnds = new Date(now);
    trialEnds.setDate(trialEnds.getDate() + 14);

    user.subscriptionPlan = 'trial';
    user.subscriptionStatus = 'active';
    user.trialStartedAt = now;
    user.trialEndsAt = trialEnds;
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          ...serializeSubscription(user),
        },
      },
      message: 'Your 14-day free trial has started!',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Stripe Checkout session for Pro plan ($9.99/mo)
// @route   POST /api/subscriptions/checkout
// @access  Private (freelancer)
export const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your server environment.',
      });
    }

    const user = await User.findById(req.user._id);
    const clientUrl = getClientUrl();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const priceId = process.env.STRIPE_PRICE_PRO;
    const lineItems = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: 'usd',
            product_data: { name: 'Tela Pro' },
            unit_amount: 999,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${clientUrl}/pricing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/pricing?canceled=1`,
      metadata: { userId: user._id.toString() },
      subscription_data: {
        metadata: { userId: user._id.toString() },
      },
    });

    res.json({ success: true, data: { url: session.url } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get subscription status
// @route   GET /api/subscriptions/status
// @access  Private (freelancer)
export const getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: {
        ...serializeSubscription(user),
        hasAccess: hasActiveSubscription(user),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Confirm Stripe Checkout session after redirect
// @route   POST /api/subscriptions/confirm
// @access  Private (freelancer)
export const confirmCheckout = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ success: false, message: 'Stripe is not configured' });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Invalid checkout session' });
    }

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return res.status(400).json({ success: false, message: 'Payment not completed yet' });
    }

    const user = await User.findById(req.user._id);
    user.subscriptionPlan = 'pro';
    user.subscriptionStatus = 'active';
    user.stripeSubscriptionId = session.subscription;
    user.subscriptionEndsAt = undefined;
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          ...serializeSubscription(user),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Stripe subscription webhook
// @route   POST /api/subscriptions/webhook
// @access  Public (Stripe)
export const subscriptionWebhook = async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ success: false, message: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const userId = session.metadata?.userId;
        if (!userId) break;

        const user = await User.findById(userId);
        if (!user) break;

        user.subscriptionPlan = 'pro';
        user.subscriptionStatus = 'active';
        user.stripeSubscriptionId = session.subscription;
        user.subscriptionEndsAt = undefined;
        await user.save();
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await User.findOne({ stripeSubscriptionId: subscription.id });
        if (!user) break;

        if (subscription.status === 'active') {
          user.subscriptionPlan = 'pro';
          user.subscriptionStatus = 'active';
          if (subscription.current_period_end) {
            user.subscriptionEndsAt = new Date(subscription.current_period_end * 1000);
          }
        } else if (subscription.status === 'past_due') {
          user.subscriptionStatus = 'past_due';
        } else if (['canceled', 'unpaid'].includes(subscription.status)) {
          user.subscriptionStatus = 'canceled';
        }
        await user.save();
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await User.findOne({ stripeSubscriptionId: subscription.id });
        if (!user) break;

        user.subscriptionStatus = 'canceled';
        await user.save();
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
