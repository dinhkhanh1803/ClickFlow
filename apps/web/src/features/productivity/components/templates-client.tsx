'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { PageState } from '@/components/states/page-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { productivityApi } from '@/features/productivity/data/productivity-api';
import { useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';

export function TemplatesClient() {
  const token = useAuthStore((state) => state.accessToken);
  const navigation = useWorkspaceNavigationQuery();
  const workspace = navigation.data?.[0];
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [sourceProjectId, setSourceProjectId] = useState('');
  const templates = useQuery({ queryKey: ['templates', workspace?.id], queryFn: () => productivityApi.templates(token!, workspace!.id), enabled: Boolean(token && workspace) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['templates', workspace?.id] });
  const create = useMutation({ mutationFn: () => productivityApi.createTemplate(token!, workspace!.id, { sourceProjectId, name }), onSuccess: () => { setName(''); void refresh(); toast.success('Template created.'); } });
  const instantiate = useMutation({ mutationFn: (templateId: string) => productivityApi.instantiate(token!, workspace!.id, templateId), onSuccess: () => toast.success('Project created from template.') });
  const archive = useMutation({ mutationFn: (templateId: string) => productivityApi.archiveTemplate(token!, workspace!.id, templateId), onSuccess: () => { void refresh(); toast.success('Template archived.'); } });
  const projects = navigation.projects.filter((project) => project.workspaceId === workspace?.id && project.archivedAt === null);

  if (navigation.isLoading || templates.isLoading) return <PageState title="Templates" kind="loading" />;
  if (!workspace || navigation.isError || templates.isError) return <PageState title="Templates" kind="error" />;

  return <section className="space-y-6 p-6"><div><h1 className="text-2xl font-bold">Templates</h1><p className="text-sm text-slate-500">Reusable project structures for {workspace.name}.</p></div><Card><CardHeader><CardTitle>Create from a project</CardTitle></CardHeader><CardContent><form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); if (name && sourceProjectId) create.mutate(); }}><input aria-label="Template name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Template name" className="rounded-lg border border-slate-300 bg-transparent px-3 py-2" /><select aria-label="Source project" value={sourceProjectId} onChange={(event) => setSourceProjectId(event.target.value)} className="rounded-lg border border-slate-300 bg-transparent px-3 py-2"><option value="">Choose source project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><Button type="submit" disabled={create.isPending}>Create</Button></form></CardContent></Card><div className="grid gap-4 md:grid-cols-2">{templates.data?.map((template) => <Card key={template.id}><CardHeader><CardTitle>{template.name}</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-500">{template.description || 'No description'}</p><div className="mt-4 flex gap-2"><Button onClick={() => instantiate.mutate(template.id)} disabled={instantiate.isPending}>Use template</Button><Button variant="ghost" onClick={() => archive.mutate(template.id)} disabled={archive.isPending}>Archive</Button></div></CardContent></Card>)}</div></section>;
}
