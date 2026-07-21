import Link from 'next/link';

import { PasswordRecoveryForm } from '@/features/auth/components/password-recovery-form';

export default function ForgotPasswordPage() {
  return <main className="grid min-h-screen place-items-center p-6"><section className="w-full max-w-md glass-surface rounded-2xl p-8"><h1 className="text-2xl font-bold">Reset password</h1><p className="mt-2 text-slate-500">Enter your email to request a password reset link.</p><div className="mt-6"><PasswordRecoveryForm mode="forgot" /></div><Link className="mt-5 block text-center text-sm text-indigo-600" href="/login">Back to sign in</Link></section></main>;
}
