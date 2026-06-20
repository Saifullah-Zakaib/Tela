export type SubscriptionPlan = 'none' | 'trial' | 'pro' | 'custom';
export type SubscriptionStatus = 'none' | 'active' | 'canceled' | 'past_due';

export interface SubscriptionInfo {
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  trialStartedAt?: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
}

export function hasActiveSubscription(user: { role: string } & SubscriptionInfo): boolean {
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
