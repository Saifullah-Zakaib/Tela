/**
 * Returns true when a freelancer has an active trial or paid plan.
 * Clients always pass (no SaaS subscription required).
 */
export function hasActiveSubscription(user) {
  if (!user || user.role !== 'freelancer') return true;

  const plan = user.subscriptionPlan || 'none';
  const status = user.subscriptionStatus || 'none';

  if (status !== 'active') return false;
  if (!['trial', 'pro', 'custom'].includes(plan)) return false;

  const now = new Date();

  if (plan === 'trial' && user.trialEndsAt && now > new Date(user.trialEndsAt)) {
    return false;
  }

  if ((plan === 'pro' || plan === 'custom') && user.subscriptionEndsAt && now > new Date(user.subscriptionEndsAt)) {
    return false;
  }

  return true;
}

export function serializeSubscription(user) {
  return {
    subscriptionPlan: user.subscriptionPlan || 'none',
    subscriptionStatus: user.subscriptionStatus || 'none',
    trialStartedAt: user.trialStartedAt,
    trialEndsAt: user.trialEndsAt,
    subscriptionEndsAt: user.subscriptionEndsAt,
  };
}
