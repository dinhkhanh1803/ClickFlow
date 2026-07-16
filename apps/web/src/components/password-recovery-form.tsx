'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const forgotSchema = z.object({ email: z.string().email('Enter a valid email address.') });
const resetSchema = z.object({ password: z.string().min(8, 'Use at least 8 characters.'), confirmPassword: z.string() }).refine(values => values.password === values.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });
type ForgotValues = z.infer<typeof forgotSchema>; type ResetValues = z.infer<typeof resetSchema>;
export function PasswordRecoveryForm({ mode }: { mode: 'forgot' | 'reset' }) {
  const forgot = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) }); const reset = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });
  if (mode === 'forgot') return <form noValidate className="space-y-4" onSubmit={forgot.handleSubmit(() => toast.success('Reset link sent', { description: 'Check your inbox for the mock recovery link.' }))}><div><label htmlFor="recovery-email" className="mb-1 block text-sm font-medium">Email address</label><Input id="recovery-email" type="email" {...forgot.register('email')} placeholder="name@company.com" />{forgot.formState.errors.email && <p role="alert" className="mt-1 text-sm text-rose-600">{forgot.formState.errors.email.message}</p>}</div><Button className="w-full" type="submit">Send reset link</Button></form>;
  return <form noValidate className="space-y-4" onSubmit={reset.handleSubmit(() => toast.success('Password updated', { description: 'Your mock ClickFlow password has been updated.' }))}><div><label htmlFor="new-password" className="mb-1 block text-sm font-medium">New password</label><Input id="new-password" type="password" {...reset.register('password')} /></div><div><label htmlFor="confirm-password" className="mb-1 block text-sm font-medium">Confirm password</label><Input id="confirm-password" type="password" {...reset.register('confirmPassword')} />{reset.formState.errors.confirmPassword && <p role="alert" className="mt-1 text-sm text-rose-600">{reset.formState.errors.confirmPassword.message}</p>}</div><Button className="w-full" type="submit">Update password</Button></form>;
}