'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/client';
import { zodFormResolver } from '@/lib/forms/zod-form-resolver';
import { useGoogleLoginMutation, useLoginMutation } from '../data/auth-mutations';
import { GoogleSignInButton } from './google-sign-in-button';

const schema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.').max(128, 'Password is too long.')
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const login = useLoginMutation();
  const googleLogin = useGoogleLoginMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodFormResolver(schema) });

  const submit = async (values: FormValues) => {
    try {
      await login.mutateAsync(values);
      toast.success('Signed in successfully', { description: 'Welcome back to ClickFlow.' });
      router.replace('/dashboard');
      router.refresh();
    } catch {
      // The mutation error is rendered below so the form remains accessible.
    }
  };

  const submitGoogle = async (credential: string) => {
    try {
      await googleLogin.mutateAsync({ credential });
      toast.success('Signed in with Google', { description: 'Welcome to ClickFlow.' });
      router.replace('/dashboard');
      router.refresh();
    } catch {
      // The mutation error is rendered below.
    }
  };
  const errorMessage = login.error instanceof ApiError
    ? login.error.status === 401 ? 'Email or password is incorrect.' : login.error.status === 403 ? 'Verify your email before signing in.' : login.error.message
    : login.error ? 'Unable to sign in. Try again.'
      : googleLogin.error instanceof ApiError
        ? googleLogin.error.status === 409 ? 'This email is already registered. Sign in with password.' : googleLogin.error.message
        : googleLogin.error ? 'Unable to sign in with Google. Try again.' : null;

  return <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
    <div className="space-y-4">
      <div><label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-200">Email address</label><Input id="email" type="email" autoComplete="email" {...register('email')} aria-invalid={Boolean(errors.email)} placeholder="name@company.com" className="border-slate-700 bg-slate-900/80 text-white placeholder:text-slate-500 focus-visible:ring-indigo-400" />{errors.email && <p role="alert" className="mt-1 text-sm text-rose-300">{errors.email.message}</p>}</div>
      <div><label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-200">Password</label><Input id="password" type="password" autoComplete="current-password" {...register('password')} aria-invalid={Boolean(errors.password)} placeholder="••••••••" className="border-slate-700 bg-slate-900/80 text-white placeholder:text-slate-500 focus-visible:ring-indigo-400" />{errors.password && <p role="alert" className="mt-1 text-sm text-rose-300">{errors.password.message}</p>}</div>
    </div>
    {errorMessage && <p role="alert" className="text-sm text-rose-300">{errorMessage}</p>}
    <Button className="h-11 w-full bg-indigo-500 text-base hover:bg-indigo-400" type="submit" disabled={login.isPending}>{login.isPending ? 'Signing in...' : 'Sign in'}</Button>
    <div className="flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-800" />or continue with<span className="h-px flex-1 bg-slate-800" /></div>
    <GoogleSignInButton pending={googleLogin.isPending} onCredential={submitGoogle} />
  </form>;
}
