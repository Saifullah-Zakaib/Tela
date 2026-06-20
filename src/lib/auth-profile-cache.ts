const FREELANCER_PROFILE_KEY = 'freelancer_profile';
const CLIENT_PROFILE_KEY = 'client_profile';

export function setFreelancerProfile(user: unknown) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(FREELANCER_PROFILE_KEY, JSON.stringify(user));
}

export function getFreelancerProfile<T = Record<string, unknown>>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(FREELANCER_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearFreelancerProfile() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(FREELANCER_PROFILE_KEY);
}

export function setClientProfile(user: unknown) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CLIENT_PROFILE_KEY, JSON.stringify(user));
}

export function getClientProfile<T = Record<string, unknown>>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CLIENT_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearClientProfile() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CLIENT_PROFILE_KEY);
}
