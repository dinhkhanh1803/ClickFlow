'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { profileApi } from '../data/profile-api';

const avatarSchema = z.object({ type: z.string().startsWith('image/'), size: z.number().max(1_000_000) });

export function ProfileClient() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [displayName, setDisplayName] = useState(user?.displayName ?? 'ClickFlow user');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const initials = displayName.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CF';

  const selectAvatar = (file?: File) => {
    if (!file) return;
    const result = avatarSchema.safeParse({ type: file.type, size: file.size });
    if (!result.success) { setError('Choose a PNG, JPG, GIF, or WebP image up to 1 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setAvatarUrl(String(reader.result)); setError(''); };
    reader.onerror = () => setError('Unable to read this image.');
    reader.readAsDataURL(file);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = displayName.trim();
    if (name.length < 2) { setError('Display name must contain at least 2 characters.'); return; }
    setSaving(true); setError('');
    try {
      const updated = accessToken ? await profileApi.update(accessToken, { displayName: name, avatarUrl }) : { ...user!, displayName: name, avatarUrl };
      updateUser(updated);
      setDisplayName(updated.displayName);
    } catch { setError('Unable to save your profile. Please try again.'); }
    finally { setSaving(false); }
  };

  return <section className="mx-auto w-full max-w-4xl p-6"><p className="text-sm text-slate-500">Account</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Profile</h1><p className="mt-2 text-sm text-slate-500">Manage the identity shown across your ClickFlow workspace.</p><form onSubmit={save} className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]"><Card><CardHeader><CardTitle>Personal details</CardTitle><p className="text-sm text-slate-500">Your updates appear across ClickFlow.</p></CardHeader><CardContent className="space-y-5"><label className="block text-sm font-medium">Display name<input aria-label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-slate-700" /></label><div className="text-sm"><span className="text-slate-500">Email</span><p className="mt-1 font-medium">{user?.email ?? 'Authenticated account'}</p></div>{error && <p role="alert" className="text-sm text-rose-600">{error}</p>}<Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button></CardContent></Card><Card><CardContent className="flex flex-col items-center p-6 text-center"><div className="relative">{avatarUrl ? <Image src={avatarUrl} alt="Profile avatar" width={96} height={96} unoptimized className="h-24 w-24 rounded-3xl object-cover shadow-lg" /> : <span className="grid h-24 w-24 place-items-center rounded-3xl bg-indigo-600 text-2xl font-bold text-white shadow-lg shadow-indigo-500/25">{initials}</span>}<label title="Choose avatar" className="absolute -bottom-2 -right-2 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500"><Camera size={17} /><input aria-label="Choose avatar image" type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" onChange={(event) => { selectAvatar(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} /></label></div><h2 className="mt-5 font-semibold">{displayName}</h2><p className="mt-1 text-sm text-slate-500">ClickFlow workspace</p>{avatarUrl && <button type="button" onClick={() => setAvatarUrl(null)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-500"><Trash2 size={14} />Remove avatar</button>}</CardContent></Card></form></section>;
}
