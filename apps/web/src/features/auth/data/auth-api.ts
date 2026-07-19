import type {
  AcceptedResponse,
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest
} from '@clickflow/contracts';

import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';

const client = createApiClient(apiBaseUrl);

export const authApi = {
  login(input: LoginRequest): Promise<AuthResponse> {
    return client.post('/auth/login', input);
  },
  register(input: RegisterRequest): Promise<AuthResponse> {
    return client.post('/auth/register', input);
  },
  refresh(csrfToken: string): Promise<AuthResponse> {
    return client.post('/auth/refresh', undefined, { headers: { 'x-csrf-token': csrfToken } });
  },
  logout(csrfToken: string): Promise<void> {
    return client.post('/auth/logout', undefined, { headers: { 'x-csrf-token': csrfToken } });
  },
  forgotPassword(input: ForgotPasswordRequest): Promise<AcceptedResponse> {
    return client.post('/auth/forgot-password', input);
  },
  resetPassword(input: ResetPasswordRequest): Promise<AcceptedResponse> {
    return client.post('/auth/reset-password', input);
  }
};
