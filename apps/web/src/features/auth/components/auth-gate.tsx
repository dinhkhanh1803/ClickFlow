'use client';

import { useEffect, type ReactNode } from 'react';

import { replaceLocation } from '@/lib/navigation/client-navigation';
import { useAuthStore } from '../model/auth-store';

export function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'unauthenticated') replaceLocation('/login');
  }, [status]);

  if (status !== 'authenticated') {
    return <main className="grid min-h-screen place-items-center"><p role="status">Checking your session...</p></main>;
  }
  return children;
}
