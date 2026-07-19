'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PageState } from '@/components/states/page-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { productivityApi } from '@/features/productivity/data/productivity-api';
import { useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';

export function WorkspaceSettingsClient() {
  const token = useAuthStore((state) => state.accessToken);
  const navigation = useWorkspaceNavigationQuery();
  const workspace = navigation.data?.[0];
  const queryClient = useQueryClient();
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
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['workspace-settings', workspace?.id] }); toast.success('Workspace settings saved.'); },
  });

  if (navigation.isLoading || settings.isLoading) return <PageState title="Workspace settings" kind="loading" />;
  if (!workspace || navigation.isError || settings.isError) return <PageState title="Workspace settings" kind="error" />;

  return <section className="mx-auto w-full max-w-4xl p-6"><p className="text-sm text-slate-500">Workspace</p><h1 className="mt-1 text-3xl font-bold">Workspace settings</h1><p className="mt-2 text-sm text-slate-500">Shared defaults for {workspace.name}.</p><Card className="mt-7"><CardHeader><CardTitle>Regional and notification defaults</CardTitle></CardHeader><CardContent><form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); update.mutate(); }}><label className="grid gap-2 text-sm">Time zone<input aria-label="Time zone" value={timezone} onChange={(event) => setTimezone(event.target.value)} className="rounded-lg border border-slate-300 bg-transparent px-3 py-2" /></label><label className="grid gap-2 text-sm">Locale<input aria-label="Locale" value={locale} onChange={(event) => setLocale(event.target.value)} className="rounded-lg border border-slate-300 bg-transparent px-3 py-2" /></label><label className="grid gap-2 text-sm">Week starts on<select aria-label="Week starts on" value={weekStartsOn} onChange={(event) => setWeekStartsOn(Number(event.target.value))} className="rounded-lg border border-slate-300 bg-transparent px-3 py-2"><option value={0}>Sunday</option><option value={1}>Monday</option><option value={6}>Saturday</option></select></label><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} />Enable notifications</label><Button type="submit" disabled={update.isPending}>Save settings</Button></form></CardContent></Card></section>;
}
