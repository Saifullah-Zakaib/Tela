export type AuthRole = 'freelancer' | 'client';

const TOKEN_KEYS: Record<AuthRole, string> = {
  freelancer: 'token_freelancer',
  client: 'token_client',
};

/** Which session to use based on the current route */
export function getActiveRole(): AuthRole {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.startsWith('/portal') || path === '/client-setup') {
      return 'client';
    }
  }
  return 'freelancer';
}

export function getToken(role?: AuthRole): string | null {
  const r = role ?? getActiveRole();
  return localStorage.getItem(TOKEN_KEYS[r]);
}

export function setToken(role: AuthRole, token: string) {
  localStorage.setItem(TOKEN_KEYS[role], token);
}

export function clearToken(role: AuthRole) {
  localStorage.removeItem(TOKEN_KEYS[role]);
}

/** Move old single-token storage into role-specific keys */
export function migrateLegacyAuth() {
  const legacyToken = localStorage.getItem('token');
  if (!legacyToken) return;

  let role: AuthRole = 'freelancer';
  try {
    const legacyUser = localStorage.getItem('user');
    if (legacyUser) {
      const parsed = JSON.parse(legacyUser);
      if (parsed?.role === 'client') role = 'client';
    }
  } catch {
    // ignore
  }

  if (!getToken(role)) {
    setToken(role, legacyToken);
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
