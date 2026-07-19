'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Mail } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/client';
import { zodFormResolver } from '@/lib/forms/zod-form-resolver';
import { useRegisterMutation, useResendVerificationMutation } from '../data/auth-mutations';

const schema = z.object({
  displayName: z.string().trim().min(2, 'Enter at least 2 characters.').max(120),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(10, 'Use at least 10 characters.').max(128),
  confirmPassword: z.string()
}).refine((value) => value.password === value.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });
type Values = z.infer<typeof schema>;

export function RegisterForm() {
  const registerAccount = useRegisterMutation();
  const resend = useResendVerificationMutation();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodFormResolver(schema) });
  const submit = async ({ confirmPassword: _confirmPassword, ...values }: Values) => {
    try { const result = await registerAccount.mutateAsync(values); setRegisteredEmail(result.email); } catch { /* rendered below */ }
  };
  if (registeredEmail) return <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-6 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300"><Mail size={22} /></span><h2 className="mt-4 text-xl font-semibold text-white">Check your email</h2><p className="mt-2 text-sm leading-6 text-slate-300">We sent a verification link to <strong>{registeredEmail}</strong>. Verify your email before signing in.</p><Button type="button" variant="ghost" className="mt-4 text-indigo-300" disabled={resend.isPending} onClick={() => resend.mutate({ email: registeredEmail })}>{resend.isPending ? 'Sending...' : resend.isSuccess ? 'Email sent again' : 'Resend verification email'}</Button><Link href="/login" className="mt-3 block text-sm font-medium text-indigo-300">Back to sign in</Link></div>;
  const error = registerAccount.error instanceof ApiError ? registerAccount.error.status === 409 ? 'An account with this email already exists.' : registerAccount.error.message : registerAccount.error ? 'Unable to create account. Try again.' : null;
  return <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4">
    <div><label htmlFor="display-name" className="mb-1.5 block text-sm font-medium text-slate-200">Full name</label><Input id="display-name" autoComplete="name" {...form.register('displayName')} className="border-slate-700 bg-slate-900/80 text-white" />{form.formState.errors.displayName && <p role="alert" className="mt-1 text-sm text-rose-300">{form.formState.errors.displayName.message}</p>}</div>
    <div><label htmlFor="register-email" className="mb-1.5 block text-sm font-medium text-slate-200">Email address</label><Input id="register-email" type="email" autoComplete="email" {...form.register('email')} className="border-slate-700 bg-slate-900/80 text-white" />{form.formState.errors.email && <p role="alert" className="mt-1 text-sm text-rose-300">{form.formState.errors.email.message}</p>}</div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="register-password" className="mb-1.5 block text-sm font-medium text-slate-200">Password</label><Input id="register-password" type="password" autoComplete="new-password" {...form.register('password')} className="border-slate-700 bg-slate-900/80 text-white" />{form.formState.errors.password && <p role="alert" className="mt-1 text-sm text-rose-300">{form.formState.errors.password.message}</p>}</div><div><label htmlFor="register-confirm" className="mb-1.5 block text-sm font-medium text-slate-200">Confirm password</label><Input id="register-confirm" type="password" autoComplete="new-password" {...form.register('confirmPassword')} className="border-slate-700 bg-slate-900/80 text-white" />{form.formState.errors.confirmPassword && <p role="alert" className="mt-1 text-sm text-rose-300">{form.formState.errors.confirmPassword.message}</p>}</div></div>
    <p className="flex items-start gap-2 text-xs leading-5 text-slate-400"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-indigo-300" />Use 10�128 characters with uppercase, lowercase, a number and a symbol.</p>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    <Button type="submit" disabled={registerAccount.isPending} className="h-11 w-full bg-indigo-500 text-base hover:bg-indigo-400">{registerAccount.isPending ? 'Creating account...' : 'Create account'}</Button>
  </form>;
}
