'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { CheckCircle2, LoaderCircle, TriangleAlert } from 'lucide-react';
import { useVerifyEmailMutation } from '../data/auth-mutations';
export function VerifyEmailClient({ token }: { token?: string }) {
  const verify = useVerifyEmailMutation();
  const started = useRef(false);
  useEffect(() => { if (!token || started.current) return; started.current = true; verify.mutate({ token }); }, [token, verify]);
  if (!token) return <State icon={TriangleAlert} title="Invalid verification link" detail="The verification token is missing." />;
  if (verify.isPending || verify.isIdle) return <State icon={LoaderCircle} spin title="Verifying your email" detail="Please wait while we activate your account." />;
  if (verify.isError) return <State icon={TriangleAlert} title="Link expired or already used" detail="Request a new verification email from the registration screen." />;
  return <State icon={CheckCircle2} title="Email verified" detail="Your ClickFlow account is active. You can now sign in." success />;
}
function State({ icon: Icon, title, detail, success = false, spin = false }: { icon: typeof CheckCircle2; title: string; detail: string; success?: boolean; spin?: boolean }) { return <div className="text-center"><span className={`mx-auto grid size-14 place-items-center rounded-2xl ${success ? 'bg-emerald-500/15 text-emerald-300' : 'bg-indigo-500/15 text-indigo-300'}`}><Icon size={26} className={spin ? 'animate-spin' : ''} /></span><h1 className="mt-5 text-2xl font-bold text-white">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p><Link href="/login" className="mt-6 inline-flex rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400">Go to sign in</Link></div>; }
