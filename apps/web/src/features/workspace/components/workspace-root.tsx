'use client';

import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceProvider, useWorkspace } from '../model/workspace-store';
import { SpaceOverview } from './space-overview';
import { ProjectWorkspace } from './project-workspace';

function WorkspaceContent() {
  const { space, activeProjectId, selectProject } = useWorkspace();
  const activeProject = space.projects.find((project) => project.id === activeProjectId && !project.archived);
  if (!activeProject) return <SpaceOverview />;
  return <section className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-5 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80"><button type="button" onClick={() => selectProject(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-300"><ArrowLeft size={16} />{space.name}</button><div className="flex items-center gap-2"><span className="hidden text-sm text-slate-500 sm:inline">Project workspace</span><Button size="sm" variant="outline" onClick={() => selectProject(null)}><LayoutDashboard size={15} />Space overview</Button></div></header><ProjectWorkspace project={activeProject} /></section>;
}

export function WorkspaceRoot({ initialProjectId }: { initialProjectId?: string }) {
  return <WorkspaceProvider initialProjectId={initialProjectId}><WorkspaceContent /></WorkspaceProvider>;
}