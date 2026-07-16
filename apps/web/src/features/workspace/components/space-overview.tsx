'use client';

import { useEffect, useState } from 'react';
import { Bookmark, CalendarDays, ChevronDown, Columns3, FileText, Folder, GanttChartSquare, LayoutDashboard, LayoutList, Link2, ListChecks, LockKeyhole, Plus, RefreshCw, Settings2, Table2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { defaultLocalSpaces, loadLocalSpaces, type LocalSpace } from '../model/local-navigation';
import { useWorkspace } from '../model/workspace-store';
import type { Project, Task } from '../model/workspace-types';
import { SpaceTabContent, SpaceTaskModal, type SpaceView } from './space-tab-content';

const spaceViews: Array<{ name: SpaceView; icon: typeof Columns3; iconClassName: string }> = [
  { name: 'Overview', icon: LayoutDashboard, iconClassName: 'text-violet-500' },
  { name: 'Board', icon: Columns3, iconClassName: 'text-blue-500' },
  { name: 'List', icon: LayoutList, iconClassName: 'text-slate-500 dark:text-slate-400' },
  { name: 'Calendar', icon: CalendarDays, iconClassName: 'text-orange-500' },
  { name: 'Table', icon: Table2, iconClassName: 'text-emerald-500' },
  { name: 'Gantt', icon: GanttChartSquare, iconClassName: 'text-rose-500' },
];

type SelectedTask = { project: Project; task: Task } | null;

export function SpaceOverview() {
  const { space, selectProject, createProject } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeView, setActiveView] = useState<SpaceView>('Overview');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [localSpaces, setLocalSpaces] = useState<LocalSpace[]>(defaultLocalSpaces);
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<SelectedTask>(null);
  const projects = space.projects.filter((project) => !project.archived);
  const recentTasks = projects.flatMap((project) => project.tasks.map((task) => ({ project, task }))).slice(0, 4);
  const query = new URLSearchParams(locationQuery);
  const spaceId = query.get('space');
  const folderId = query.get('folder');
  const selectedLocalSpace = localSpaces.find((item) => item.id === spaceId) ?? localSpaces[0];
  const selectedFolder = selectedLocalSpace?.items.find((item) => item.id === folderId && item.kind === 'folder');
  const folders = selectedLocalSpace?.items.filter((item) => item.kind === 'folder') ?? [];
  const docs = selectedLocalSpace?.items.filter((item) => item.kind === 'doc') ?? [];
  const title = selectedFolder ? `${selectedLocalSpace.name} / ${selectedFolder.name}` : selectedLocalSpace?.name ?? space.name;

  useEffect(() => {
    const refreshNavigation = () => {
      setLocalSpaces(loadLocalSpaces());
      setLocationQuery(window.location.search);
    };
    refreshNavigation();
    window.addEventListener('clickflow:local-spaces-changed', refreshNavigation);
    window.addEventListener('clickflow:space-navigation', refreshNavigation);
    window.addEventListener('popstate', refreshNavigation);
    return () => {
      window.removeEventListener('clickflow:local-spaces-changed', refreshNavigation);
      window.removeEventListener('clickflow:space-navigation', refreshNavigation);
      window.removeEventListener('popstate', refreshNavigation);
    };
  }, []);

  useEffect(() => {
    const taskId = query.get('task');
    const projectId = query.get('project');
    if (!taskId || query.get('view') !== 'Overview') return;
    const project = projects.find((item) => item.id === projectId) ?? projects.find((item) => item.tasks.some((task) => task.id === taskId));
    const task = project?.tasks.find((item) => item.id === taskId);
    if (project && task) setSelectedTask({ project, task });
  }, [locationQuery, projects]);

  const openTask = (project: Project, task: Task) => {
    setSelectedTask({ project, task });
    const url = new URL(window.location.href);
    url.searchParams.set('project', project.id);
    url.searchParams.set('task', task.id);
    url.searchParams.set('view', 'Overview');
    window.history.pushState(null, '', url);
    setLocationQuery(url.search);
  };
  const closeTask = () => {
    setSelectedTask(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('project');
    url.searchParams.delete('task');
    url.searchParams.delete('view');
    window.history.replaceState(null, '', url);
    setLocationQuery(url.search);
  };
  const openFolder = (folder: string) => {
    const url = new URL(window.location.href);
    if (selectedLocalSpace) url.searchParams.set('space', selectedLocalSpace.id);
    url.searchParams.set('folder', folder);
    window.history.pushState(null, '', url);
    setLocationQuery(url.search);
  };
  const openFirstProject = () => { if (projects[0]) selectProject(projects[0].id); };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    createProject({ name: name.trim(), description: description.trim() || 'New project in this Space.' });
    setName('');
    setDescription('');
    setCreating(false);
  };

  return <main className="min-h-[calc(100vh-4rem)] bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex min-h-14 items-center justify-between gap-3 px-5"><div className="flex min-w-0 items-center gap-2 text-sm"><span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-indigo-500 text-[9px] font-bold text-white">T</span><span className="truncate font-semibold">{title}</span></div><button type="button" onClick={() => setSharing(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"><Users size={16} />Share</button></div>
      <div role="tablist" aria-label="Space views" className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 dark:border-slate-900">{spaceViews.map(({ name: view, icon: Icon, iconClassName }) => <button key={view} role="tab" aria-selected={activeView === view} onClick={() => setActiveView(view)} className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-3 text-sm ${activeView === view ? 'border-slate-900 font-semibold dark:border-white' : 'border-transparent text-slate-500 hover:text-indigo-600'}`}><Icon aria-hidden="true" size={15} strokeWidth={2.2} className={`shrink-0 ${iconClassName}`} />{view}</button>)}<span className="flex shrink-0 items-center gap-1 px-3 py-3 text-sm text-slate-500"><Plus size={15} />View</span></div>
    </header>
{activeView === 'Overview' && <div className="flex items-center justify-end gap-3 border-b border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-900"><span className="inline-flex items-center gap-1 text-emerald-600"><RefreshCw size={13} />All changes saved</span><button className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">Auto refresh: On</button><button aria-label="Overview settings" className="rounded border border-slate-200 p-1.5 hover:text-indigo-600 dark:border-slate-700"><Settings2 size={15} /></button></div>}
    {activeView === 'Overview' ? <><section className="grid gap-4 p-4 lg:grid-cols-3"><article className="min-h-72 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><h2 className="text-sm font-semibold">Recent</h2><div className="mt-4 space-y-3">{recentTasks.length ? recentTasks.map(({ project, task }) => <button type="button" onClick={() => openTask(project, task)} key={task.id} className="flex w-full items-center gap-3 text-left text-sm hover:text-indigo-600"><ListChecks size={16} className="shrink-0 text-slate-500" /><span className="truncate">{task.title} <span className="text-slate-400">· in {project.name}</span></span></button>) : <p className="text-sm text-slate-500">No recent tasks yet.</p>}</div></article><article className="min-h-72 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><h2 className="text-sm font-semibold">Docs</h2><div className="mt-4 space-y-3">{docs.length ? docs.map((doc) => <button type="button" key={doc.id} className="flex w-full items-center gap-3 text-left text-sm hover:text-indigo-600"><FileText size={16} className="text-slate-500" /><span>{doc.name} <span className="text-slate-400">· in {selectedLocalSpace?.name}</span></span></button>) : projects.slice(0, 3).map((project) => <button type="button" key={project.id} className="flex w-full items-center gap-3 text-left text-sm hover:text-indigo-600"><FileText size={16} className="text-slate-500" /><span>{project.name} brief <span className="text-slate-400">· in {selectedLocalSpace?.name}</span></span></button>)}</div></article><article className="flex min-h-72 flex-col rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><h2 className="text-sm font-semibold">Bookmarks</h2><div className="flex flex-1 flex-col items-center justify-center text-center"><Bookmark size={44} className="text-slate-300" /><p className="mt-4 max-w-xs text-sm text-slate-500">Save a Space, project, task, or useful link for quick access.</p>{bookmarked && <button onClick={openFirstProject} className="mt-3 text-sm font-semibold text-indigo-600">{projects[0]?.name}</button>}<Button size="sm" className="mt-4" onClick={() => setBookmarked((value) => !value)}>{bookmarked ? 'Bookmark saved' : 'Add Bookmark'}</Button></div></article></section><section className="mx-4 mb-4 min-h-80 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">Folders</h2><p className="mt-1 text-xs text-slate-500">Folders in {selectedLocalSpace?.name}</p></div><Button size="sm" variant="ghost" onClick={() => setCreating(true)}><Plus size={15} />New project</Button></div><div className="mt-4 flex flex-wrap gap-3">{folders.length ? folders.map((folder) => { const lists = selectedLocalSpace?.items.filter((item) => item.parentId === folder.id && item.kind === 'list') ?? []; return <button type="button" key={folder.id} onClick={() => openFolder(folder.id)} className={`flex min-w-64 items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 ${selectedFolder?.id === folder.id ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-700'}`}><Folder className="text-slate-500" size={20} />{folder.name}<span className="ml-auto text-xs font-normal text-slate-400">{lists.length} lists</span></button>; }) : <p className="text-sm text-slate-500">No folders in this Space yet.</p>}</div></section></> : <SpaceTabContent view={activeView as Exclude<SpaceView, 'Overview'>} projects={projects} onOpenProject={selectProject} />}
    {selectedTask && <SpaceTaskModal project={selectedTask.project} task={selectedTask.task} onClose={closeTask} />}
    <Dialog open={sharing} onOpenChange={setSharing} contentClassName="max-w-lg p-0">
      <section className="overflow-hidden rounded-2xl bg-white dark:bg-slate-950"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><DialogTitle>Share this Space</DialogTitle><p className="mt-1 text-sm text-slate-500">Sharing {selectedLocalSpace?.name} with all views.</p></div><button type="button" aria-label="Close share dialog" onClick={() => setSharing(false)} className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"><X size={16} /></button></header><div className="space-y-5 p-5"><div className="flex gap-2 rounded-xl border border-slate-200 p-2 dark:border-slate-700"><input aria-label="Invite by name or email" placeholder="Invite by name or email" className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" /><Button size="sm">Invite</Button></div><div className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-2 font-medium"><Link2 size={16} />Private link</span><Button size="sm" variant="outline">Copy link</Button></div><div className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-2 font-medium"><Users size={16} />Default permission</span><button type="button" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm dark:border-slate-700">Full edit<ChevronDown size={14} /></button></div><div className="border-t border-slate-100 pt-4 dark:border-slate-800"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Share with</p><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-500 text-xs font-bold text-white">S1</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{selectedLocalSpace?.name}</p><p className="text-xs text-slate-500">Space members</p></div><span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-200">Full edit</span></div></div></div><footer className="border-t border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/60"><button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800"><LockKeyhole size={15} />Make Private</button></footer></section>
    </Dialog>    <Dialog open={creating} onOpenChange={setCreating}><form onSubmit={submit} className="space-y-4"><DialogTitle>Create a project</DialogTitle><label className="block text-sm font-medium">Project name<input aria-label="Project name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" autoFocus /></label><label className="block text-sm font-medium">Description<textarea aria-label="Project description" value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" /></label><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit">Create project</Button></div></form></Dialog>
  </main>;
}