'use client';

import { useEffect, type ReactNode } from 'react';

import { authApi } from '../data/auth-api';
import { useAuthStore } from '../model/auth-store';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const value = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    const csrfToken = readCookie('clickflow_csrf');
    if (!csrfToken) {
      clearSession();
      return;
    }

    let active = true;
    void authApi.refresh(csrfToken)
      .then((session) => { if (active) setSession(session); })
      .catch(() => { if (active) clearSession(); });
    return () => { active = false; };
  }, [clearSession, setSession]);

  return children;
}
