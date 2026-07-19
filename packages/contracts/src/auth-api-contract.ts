export interface AuthUserResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  csrfToken: string;
  user: AuthUserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  credential: string;
}

export interface RegisterRequest extends LoginRequest {
  displayName: string;
}

export interface VerifyEmailRequest { token: string; }

export interface ResendVerificationRequest { email: string; }

export interface EmailRegistrationResponse extends AcceptedResponse { email: string; }

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AcceptedResponse {
  accepted: true;
}
