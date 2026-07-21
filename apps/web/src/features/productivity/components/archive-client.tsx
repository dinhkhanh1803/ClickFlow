'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { PageState } from '@/components/states/page-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { productivityApi, type ArchiveItem } from '@/features/productivity/data/productivity-api';
import { useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';

export function ArchiveClient() {
  const token = useAuthStore((state) => state.accessToken);
  const navigation = useWorkspaceNavigationQuery();
  const workspace = navigation.data?.[0];
  const queryClient = useQueryClient();
  const archive = useQuery({ queryKey: ['archive', workspace?.id], queryFn: () => productivityApi.archive(token!, workspace!.id), enabled: Boolean(token && workspace) });
  const restore = useMutation({
    mutationFn: ({ type, id }: { type: 'project' | 'task' | 'template'; id: string }) => productivityApi.restore(token!, workspace!.id, type, id),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['archive', workspace?.id] }); toast.success('Item restored.'); },
  });

  if (navigation.isLoading || archive.isLoading) return <PageState title="Archive" kind="loading" />;
  if (!workspace || navigation.isError || archive.isError || !archive.data) return <PageState title="Archive" kind="error" />;
  const groups: Array<{ type: 'project' | 'task' | 'template'; label: string; items: ArchiveItem[] }> = [
    { type: 'project', label: 'Projects', items: archive.data.projects },
    { type: 'task', label: 'Tasks', items: archive.data.tasks },
    { type: 'template', label: 'Templates', items: archive.data.templates },
  ];

  return <section className="space-y-6 p-6"><div><h1 className="text-2xl font-bold">Archive</h1><p className="text-sm text-slate-500">Restore archived work in {workspace.name}.</p></div>{groups.map((group) => <Card key={group.type}><CardHeader><CardTitle>{group.label}</CardTitle></CardHeader><CardContent>{group.items.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{group.items.map((item) => <div key={item.id} className="flex items-center justify-between py-3"><div><p className="font-medium">{item.name ?? item.title}</p><p className="text-xs text-slate-500">{new Date(item.archivedAt).toLocaleString()}</p></div><Button variant="ghost" onClick={() => restore.mutate({ type: group.type, id: item.id })}><RotateCcw size={16} />Restore</Button></div>)}</div> : <p className="text-sm text-slate-500">No archived {group.label.toLowerCase()}.</p>}</CardContent></Card>)}</section>;
}
