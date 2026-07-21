'use client';

import type { ForgotPasswordRequest, GoogleLoginRequest, LoginRequest, RegisterRequest, ResendVerificationRequest, ResetPasswordRequest, VerifyEmailRequest } from '@clickflow/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authApi } from './auth-api';
import { useAuthStore } from '../model/auth-store';

export function useRegisterMutation() {
  return useMutation({ mutationFn: (input: RegisterRequest) => authApi.register(input) });
}
export function useVerifyEmailMutation() {
  return useMutation({ mutationFn: (input: VerifyEmailRequest) => authApi.verifyEmail(input) });
}
export function useResendVerificationMutation() {
  return useMutation({ mutationFn: (input: ResendVerificationRequest) => authApi.resendVerification(input) });
}
export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: (input: LoginRequest) => authApi.login(input),
    onSuccess: setSession
  });
}

export function useGoogleLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: (input: GoogleLoginRequest) => authApi.googleLogin(input),
    onSuccess: setSession
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const csrfToken = useAuthStore((state) => state.csrfToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  return useMutation({
    mutationFn: async () => {
      if (csrfToken) await authApi.logout(csrfToken);
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
    }
  });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: (input: ForgotPasswordRequest) => authApi.forgotPassword(input) });
}

export function useResetPasswordMutation() {
  return useMutation({ mutationFn: (input: ResetPasswordRequest) => authApi.resetPassword(input) });
}
