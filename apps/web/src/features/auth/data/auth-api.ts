import type { AcceptedResponse, AuthResponse, EmailRegistrationResponse, ForgotPasswordRequest, GoogleLoginRequest, LoginRequest, RegisterRequest, ResendVerificationRequest, ResetPasswordRequest, VerifyEmailRequest } from '@clickflow/contracts';
import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';

const client = createApiClient(apiBaseUrl);
export const authApi = {
  login: (input: LoginRequest): Promise<AuthResponse> => client.post('/auth/login', input),
  googleLogin: (input: GoogleLoginRequest): Promise<AuthResponse> => client.post('/auth/google', input),
  register: (input: RegisterRequest): Promise<EmailRegistrationResponse> => client.post('/auth/register-email', input),
  verifyEmail: (input: VerifyEmailRequest): Promise<AcceptedResponse> => client.post('/auth/verify-email', input),
  resendVerification: (input: ResendVerificationRequest): Promise<AcceptedResponse> => client.post('/auth/resend-verification', input),
  refresh: (csrfToken: string): Promise<AuthResponse> => client.post('/auth/refresh', undefined, { headers: { 'x-csrf-token': csrfToken } }),
  logout: (csrfToken: string): Promise<void> => client.post('/auth/logout', undefined, { headers: { 'x-csrf-token': csrfToken } }),
  forgotPassword: (input: ForgotPasswordRequest): Promise<AcceptedResponse> => client.post('/auth/forgot-password', input),
  resetPassword: (input: ResetPasswordRequest): Promise<AcceptedResponse> => client.post('/auth/reset-password', input)
};
