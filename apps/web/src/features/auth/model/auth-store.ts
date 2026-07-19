'use client';

import type { AuthResponse, AuthUserResponse } from '@clickflow/contracts';
import { create } from 'zustand';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  csrfToken: string | null;
  user: AuthUserResponse | null;
  setLoading(): void;
  setSession(session: AuthResponse): void;
  clearSession(): void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  accessToken: null,
  csrfToken: null,
  user: null,
  setLoading: () => set({ status: 'loading' }),
  setSession: (session) => set({
    status: 'authenticated',
    accessToken: session.accessToken,
    csrfToken: session.csrfToken,
    user: session.user
  }),
  clearSession: () => set({
    status: 'unauthenticated',
    accessToken: null,
    csrfToken: null,
    user: null
  })
}));

export function getAuthSession(): Pick<AuthState, 'accessToken' | 'csrfToken' | 'user'> {
  const { accessToken, csrfToken, user } = useAuthStore.getState();
  return { accessToken, csrfToken, user };
}
