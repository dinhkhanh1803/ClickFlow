'use client';
import { useState } from 'react';

export function LoginForm() {
  const [notice, setNotice] = useState('');
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setNotice('Mock sign-in successful.'); }
  return <form onSubmit={submit} className="space-y-4" noValidate><div><label htmlFor="email" className="mb-1 block text-sm font-medium">Email address</label><input id="email" name="email" type="email" required placeholder="name@company.com" className="w-full rounded-lg border border-slate-200 px-3 py-2" /></div><div><label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label><input id="password" name="password" type="password" required placeholder="••••••••" className="w-full rounded-lg border border-slate-200 px-3 py-2" /></div><button className="w-full rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white">Sign in</button>{notice && <p role="status" className="text-sm text-emerald-600">{notice}</p>}</form>;
}
