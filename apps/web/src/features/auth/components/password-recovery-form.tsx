'use client';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/client';
import { zodFormResolver } from '@/lib/forms/zod-form-resolver';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../data/auth-mutations';

const forgotSchema = z.object({ email: z.email('Enter a valid email address.') });
const resetSchema = z.object({
  password: z.string().min(10, 'Use at least 10 characters.').max(128),
  confirmPassword: z.string()
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword']
});

type ForgotValues = z.infer<typeof forgotSchema>;
type ResetValues = z.infer<typeof resetSchema>;

function mutationMessage(error: unknown): string | null {
  if (!error) return null;
  return error instanceof ApiError ? error.message : 'Request failed. Try again.';
}

export function PasswordRecoveryForm({ mode, token }: { mode: 'forgot' | 'reset'; token?: string }) {
  const forgot = useForm<ForgotValues>({ resolver: zodFormResolver(forgotSchema) });
  const reset = useForm<ResetValues>({ resolver: zodFormResolver(resetSchema) });
  const forgotMutation = useForgotPasswordMutation();
  const resetMutation = useResetPasswordMutation();

  if (mode === 'forgot') {
    const submitForgot = async (values: ForgotValues) => {
      try {
        await forgotMutation.mutateAsync(values);
        toast.success('Reset link requested', { description: 'If the account exists, check its inbox.' });
      } catch { /* Accessible error is rendered below. */ }
    };
    return <form noValidate className="space-y-4" onSubmit={forgot.handleSubmit(submitForgot)}><div><label htmlFor="recovery-email" className="mb-1 block text-sm font-medium">Email address</label><Input id="recovery-email" type="email" autoComplete="email" {...forgot.register('email')} placeholder="name@company.com" />{forgot.formState.errors.email && <p role="alert" className="mt-1 text-sm text-rose-600">{forgot.formState.errors.email.message}</p>}</div>{mutationMessage(forgotMutation.error) && <p role="alert" className="text-sm text-rose-600">{mutationMessage(forgotMutation.error)}</p>}<Button className="w-full" type="submit" disabled={forgotMutation.isPending}>{forgotMutation.isPending ? 'Sending...' : 'Send reset link'}</Button></form>;
  }

  const submitReset = async (values: ResetValues) => {
    if (!token) return;
    try {
      await resetMutation.mutateAsync({ token, password: values.password });
      toast.success('Password updated', { description: 'You can now sign in with the new password.' });
    } catch { /* Accessible error is rendered below. */ }
  };
  return <form noValidate className="space-y-4" onSubmit={reset.handleSubmit(submitReset)}>{!token && <p role="alert" className="text-sm text-rose-600">Reset link is invalid or missing.</p>}<div><label htmlFor="new-password" className="mb-1 block text-sm font-medium">New password</label><Input id="new-password" type="password" autoComplete="new-password" {...reset.register('password')} />{reset.formState.errors.password && <p role="alert" className="mt-1 text-sm text-rose-600">{reset.formState.errors.password.message}</p>}</div><div><label htmlFor="confirm-password" className="mb-1 block text-sm font-medium">Confirm password</label><Input id="confirm-password" type="password" autoComplete="new-password" {...reset.register('confirmPassword')} />{reset.formState.errors.confirmPassword && <p role="alert" className="mt-1 text-sm text-rose-600">{reset.formState.errors.confirmPassword.message}</p>}</div>{mutationMessage(resetMutation.error) && <p role="alert" className="text-sm text-rose-600">{mutationMessage(resetMutation.error)}</p>}<Button className="w-full" type="submit" disabled={!token || resetMutation.isPending}>{resetMutation.isPending ? 'Updating...' : 'Update password'}</Button></form>;
}
