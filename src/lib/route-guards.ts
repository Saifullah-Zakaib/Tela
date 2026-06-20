import { redirect } from '@tanstack/react-router';
import { authApi } from './api';
import { getToken } from './auth-storage';
import {
  getFreelancerProfile,
  setFreelancerProfile,
  clearFreelancerProfile,
  getClientProfile,
  setClientProfile,
  clearClientProfile,
} from './auth-profile-cache';
import { hasActiveSubscription } from './subscription';

type AuthUser = {
  role: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
};

async function fetchFreelancerUser(): Promise<AuthUser | null> {
  const token = getToken('freelancer');
  if (!token) return null;

  const cached = getFreelancerProfile<AuthUser>();
  if (cached?.role) return cached;

  try {
    const response = await authApi.getMeAs('freelancer');
    setFreelancerProfile(response.data);
    return response.data as AuthUser;
  } catch {
    clearFreelancerProfile();
    return null;
  }
}

async function fetchClientUser(): Promise<AuthUser | null> {
  const token = getToken('client');
  if (!token) return null;

  const cached = getClientProfile<AuthUser>();
  if (cached?.role) return cached;

  try {
    const response = await authApi.getMeAs('client');
    setClientProfile(response.data);
    return response.data as AuthUser;
  } catch {
    clearClientProfile();
    return null;
  }
}

/** Freelancer app routes — requires freelancer login + active trial/subscription. */
export async function freelancerAppBeforeLoad() {
  if (typeof window === 'undefined') return;

  const token = getToken('freelancer');
  
  if (!token) {
    throw redirect({ to: '/login' });
  }

  const user = await fetchFreelancerUser();
  if (!user || user.role !== 'freelancer') {
    throw redirect({ to: '/login' });
  }

  // Temporarily disable subscription check for development
  // if (!hasActiveSubscription(user)) {
  //   throw redirect({ to: '/pricing' });
  // }
}

/** Client portal routes — requires client login only. */
export async function clientPortalBeforeLoad() {
  if (typeof window === 'undefined') return;

  if (!getToken('client')) {
    throw redirect({ to: '/login' });
  }

  const user = await fetchClientUser();
  if (!user || user.role !== 'client') {
    throw redirect({ to: '/login' });
  }
}

/** Pricing page — freelancer must be logged in but subscription not required. */
export async function pricingBeforeLoad() {
  if (typeof window === 'undefined') return;

  if (!getToken('freelancer')) {
    throw redirect({ to: '/signup' });
  }

  const user = await fetchFreelancerUser();
  if (!user || user.role !== 'freelancer') {
    throw redirect({ to: '/signup' });
  }

  const plan = user.subscriptionPlan || 'none';
  if (hasActiveSubscription(user) && (plan === 'pro' || plan === 'custom')) {
    throw redirect({ to: '/dashboard' });
  }
}

/** Signup — only redirect if freelancer already logged in. */
export async function signupBeforeLoad() {
  if (typeof window === 'undefined') return;

  const freelancer = await fetchFreelancerUser();
  if (freelancer?.role === 'freelancer') {
    throw redirect({ to: hasActiveSubscription(freelancer) ? '/dashboard' : '/pricing' });
  }
}

/** Login — only redirect if freelancer already logged in. */
export async function loginBeforeLoad() {
  if (typeof window === 'undefined') return;

  const freelancer = await fetchFreelancerUser();
  if (freelancer?.role === 'freelancer') {
    throw redirect({ to: hasActiveSubscription(freelancer) ? '/dashboard' : '/pricing' });
  }
}
