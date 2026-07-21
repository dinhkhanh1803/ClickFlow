import { z } from 'zod';

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(10).max(128);

export const registerSchema = z.object({
  email,
  displayName: z.string().trim().min(2).max(120),
  password
}).strict();

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const googleLoginSchema = z.object({ credential: z.string().min(100).max(10_000) }).strict();
export const verifyEmailSchema = z.object({ token: z.string().min(40).max(256) }).strict();
export const resendVerificationSchema = z.object({ email }).strict();
export const forgotPasswordSchema = z.object({ email }).strict();
export const resetPasswordSchema = z.object({ token: z.string().min(40).max(256), password }).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
