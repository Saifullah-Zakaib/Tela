import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from './api';
import {
  type AuthRole,
  getActiveRole,
  setToken,
  clearToken,
  migrateLegacyAuth,
  getToken,
} from './auth-storage';
import type { SubscriptionInfo } from './subscription';
import {
  setFreelancerProfile,
  clearFreelancerProfile,
  setClientProfile,
  clearClientProfile,
} from './auth-profile-cache';

interface User extends SubscriptionInfo {
  _id: string;
  name: string;
  email: string;
  role: 'freelancer' | 'client';
  avatar?: string;
  businessName?: string;
  brandColor?: string;
}

interface AuthContextType {
  freelancer: User | null;
  client: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: (role?: AuthRole) => void;
  refreshUser: (role?: AuthRole) => Promise<void>;
  setFreelancerUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [freelancer, setFreelancer] = useState<User | null>(null);
  const [client, setClient] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    migrateLegacyAuth();

    const tasks: Promise<void>[] = [];

    if (getToken('freelancer')) {
      tasks.push(
        authApi.getMeAs('freelancer')
          .then((response) => {
            setFreelancer(response.data);
            setFreelancerProfile(response.data);
          })
          .catch(() => {
            clearToken('freelancer');
            clearFreelancerProfile();
            setFreelancer(null);
          }),
      );
    }

    if (getToken('client')) {
      tasks.push(
        authApi.getMeAs('client')
          .then((response) => {
            setClient(response.data);
            setClientProfile(response.data);
          })
          .catch(() => {
            clearToken('client');
            clearClientProfile();
            setClient(null);
          }),
      );
    }

    await Promise.allSettled(tasks);
    setLoading(false);
  }

  async function login(email: string, password: string) {
    const response = await authApi.login({ email, password });
    const user = response.data.user as User;
    const role: AuthRole = user.role === 'client' ? 'client' : 'freelancer';

    setToken(role, response.data.token);

    if (role === 'client') {
      setClient(user);
      setClientProfile(user);
    } else {
      setFreelancer(user);
      setFreelancerProfile(user);
    }

    return user;
  }

  async function register(name: string, email: string, password: string) {
    const response = await authApi.register({ name, email, password });
    setToken('freelancer', response.data.token);
    setFreelancer(response.data.user);
    setFreelancerProfile(response.data.user);
  }

  function logout(role?: AuthRole) {
    const r = role ?? getActiveRole();
    clearToken(r);
    if (r === 'client') {
      clearClientProfile();
      setClient(null);
    } else {
      clearFreelancerProfile();
      setFreelancer(null);
    }
    window.location.href = '/login';
  }

  async function refreshUser(role?: AuthRole) {
    const r = role ?? getActiveRole();
    const response = await authApi.getMeAs(r);
    if (r === 'client') {
      setClient(response.data);
      setClientProfile(response.data);
    } else {
      setFreelancer(response.data);
      setFreelancerProfile(response.data);
    }
  }

  function setFreelancerUser(user: User) {
    setFreelancer(user);
    setFreelancerProfile(user);
  }

  return (
    <AuthContext.Provider value={{ freelancer, client, loading, login, register, logout, refreshUser, setFreelancerUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  const activeRole = getActiveRole();
  const user = activeRole === 'client' ? context.client : context.freelancer;

  return {
    user,
    loading: context.loading,
    activeRole,
    freelancer: context.freelancer,
    client: context.client,
    login: context.login,
    register: context.register,
    logout: () => context.logout(activeRole),
    refreshUser: (role?: AuthRole) => context.refreshUser(role),
    setFreelancerUser: context.setFreelancerUser,
  };
}
