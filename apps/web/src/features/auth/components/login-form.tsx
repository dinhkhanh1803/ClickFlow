'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notifyMockSignIn } from '@/lib/feedback/toast-feedback';

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
});

type FormValues = z.infer<typeof schema>;

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.35 12.25c0-.7-.06-1.38-.18-2.03H12v3.84h5.24a4.48 4.48 0 0 1-1.94 2.94v2.49h3.14c1.84-1.7 2.91-4.2 2.91-7.24Z" /><path fill="#34A853" d="M12 21.75c2.62 0 4.82-.86 6.44-2.26l-3.14-2.49c-.87.58-1.99.92-3.3.92-2.53 0-4.67-1.7-5.44-4v2.56H3.31a9.73 9.73 0 0 0 8.69 5.27Z" /><path fill="#FBBC05" d="M6.56 13.92A5.87 5.87 0 0 1 6.26 12c0-.67.12-1.31.3-1.92V7.52H3.31A9.75 9.75 0 0 0 2.25 12c0 1.61.39 3.13 1.06 4.48l3.25-2.56Z" /><path fill="#EA4335" d="M12 6.08c1.42 0 2.69.49 3.69 1.44l2.77-2.77C16.81 3.2 14.61 2.25 12 2.25a9.73 9.73 0 0 0-8.69 5.27l3.25 2.56c.77-2.3 2.91-4 5.44-4Z" /></svg>;
}

export function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitSuccessful } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [googlePending, setGooglePending] = useState(false);

  const startGoogleMock = () => {
    if (googlePending) return;
    setGooglePending(true);
    window.setTimeout(() => {
      notifyMockSignIn();
      window.location.assign('/dashboard');
    }, 550);
  };

  return <form onSubmit={handleSubmit(() => notifyMockSignIn())} className="space-y-5" noValidate>
    <div className="space-y-4">
      <div><label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-200">Email address</label><Input id="email" type="email" {...register('email')} aria-invalid={Boolean(errors.email)} placeholder="name@company.com" className="border-slate-700 bg-slate-900/80 text-white placeholder:text-slate-500 focus-visible:ring-indigo-400" />{errors.email && <p role="alert" className="mt-1 text-sm text-rose-300">{errors.email.message}</p>}</div>
      <div><label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-200">Password</label><Input id="password" type="password" {...register('password')} placeholder="••••••••" className="border-slate-700 bg-slate-900/80 text-white placeholder:text-slate-500 focus-visible:ring-indigo-400" />{errors.password && <p role="alert" className="mt-1 text-sm text-rose-300">{errors.password.message}</p>}</div>
    </div>
    <Button className="h-11 w-full bg-indigo-500 text-base hover:bg-indigo-400" type="submit">Sign in</Button>
    <div className="flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-800" />or continue with<span className="h-px flex-1 bg-slate-800" /></div>
    <Button type="button" variant="outline" disabled={googlePending} aria-label="Continue with Google" onClick={startGoogleMock} className="h-11 w-full border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-800 hover:text-white"><GoogleMark />{googlePending ? 'Connecting to Google...' : 'Continue with Google'}</Button>
    {googlePending && <p role="status" className="text-center text-sm text-indigo-200">Connecting to Google...</p>}
    {isSubmitSuccessful && <p role="status" className="text-center text-sm text-emerald-300">Mock sign-in successful.</p>}
  </form>;
}