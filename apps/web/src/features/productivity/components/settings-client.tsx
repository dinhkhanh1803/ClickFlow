'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Globe2, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { PageState } from '@/components/states/page-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { productivityApi } from '@/features/productivity/data/productivity-api';
import { useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';

export function SettingsClient() {
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const navigation = useWorkspaceNavigationQuery();
  const queryClient = useQueryClient();
  const workspace = navigation.data?.[0];
  const settings = useQuery({ queryKey: ['workspace-settings', workspace?.id], queryFn: () => productivityApi.settings(token!, workspace!.id), enabled: Boolean(token && workspace) });
  const [timezone, setTimezone] = useState('');
  const [locale, setLocale] = useState('');
  const [weekStartsOn, setWeekStartsOn] = useState(1);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (!settings.data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimezone(settings.data.timezone);
    setLocale(settings.data.locale);
    setWeekStartsOn(settings.data.preferences.weekStartsOn ?? 1);
    setNotifications(settings.data.preferences.notifications ?? true);
  }, [settings.data]);

  const update = useMutation({
    mutationFn: () => productivityApi.updateSettings(token!, workspace!.id, { timezone, locale, preferences: { weekStartsOn, notifications } }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['workspace-settings', workspace?.id] }); toast.success('Settings saved.'); },
    onError: () => toast.error('Unable to save settings.')
  });

  if (navigation.isLoading || settings.isLoading) return <PageState title="Settings" kind="loading" />;
  if (!workspace || navigation.isError || settings.isError) return <PageState title="Settings" kind="error" />;

  return <section className="mx-auto w-full max-w-5xl p-6"><p className="text-sm text-slate-500">ClickFlow / Settings</p><h1 className="mt-2 text-3xl font-bold">Settings</h1><p className="mt-2 text-sm text-slate-500">Account identity and default workspace preferences.</p><div className="mt-6 grid gap-4 lg:grid-cols-[20rem_1fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound size={18} />Account</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3"><span aria-hidden="true" style={user?.avatarUrl ? { backgroundImage: 'url("' + user.avatarUrl + '")' } : undefined} className="grid h-12 w-12 place-items-center rounded-full bg-indigo-500 bg-cover bg-center text-sm font-bold text-white">{user?.avatarUrl ? '' : (user?.displayName ?? user?.email ?? 'U').slice(0, 2).toUpperCase()}</span><div className="min-w-0"><p className="truncate font-semibold">{user?.displayName ?? 'ClickFlow user'}</p><p className="truncate text-sm text-slate-500">{user?.email ?? 'No email loaded'}</p></div></div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Globe2 size={18} />Workspace defaults</CardTitle></CardHeader><CardContent><form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); update.mutate(); }}><label className="grid gap-2 text-sm">Time zone<input aria-label="Time zone" value={timezone} onChange={(event) => setTimezone(event.target.value)} className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700" /></label><label className="grid gap-2 text-sm">Locale<input aria-label="Locale" value={locale} onChange={(event) => setLocale(event.target.value)} className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700" /></label><label className="grid gap-2 text-sm">Week starts on<select aria-label="Week starts on" value={weekStartsOn} onChange={(event) => setWeekStartsOn(Number(event.target.value))} className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"><option value={0}>Sunday</option><option value={1}>Monday</option><option value={6}>Saturday</option></select></label><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} /><span className="inline-flex items-center gap-2"><Bell size={15} />Enable notifications</span></label><Button type="submit" disabled={update.isPending}>{update.isPending ? 'Saving...' : 'Save settings'}</Button></form></CardContent></Card></div></section>;
}
