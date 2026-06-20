import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth-context';

type Role = 'freelancer' | 'client';

export function useRequireAuth(requiredRole: Role = 'freelancer') {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.navigate({ to: '/login' });
      return;
    }

    // Check role matches
    if (requiredRole === 'freelancer' && user.role !== 'freelancer') {
      router.navigate({ to: '/login' });
    } else if (requiredRole === 'client' && user.role !== 'client') {
      router.navigate({ to: '/login' });
    }
  }, [user, router, requiredRole]);

  return { user, isAuthenticated: !!user };
}
