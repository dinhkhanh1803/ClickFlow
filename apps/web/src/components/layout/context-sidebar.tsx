'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, ChevronsLeft, FileText, Folder, LayoutDashboard, ListChecks, MoreHorizontal, PanelTop, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { notifyToastPreview } from '@/lib/feedback/toast-feedback';
import { defaultLocalSpaces, loadLocalSpaces, localId, nextSpaceTone, saveLocalSpaces, type LocalSpaceItemKind } from '@/features/workspace/model/local-navigation';
import type { GlobalModulePath } from '@/components/layout/app-sidebar';
import { useArchiveProjectMutation, useArchiveSectionMutation, useCreateProjectMutation, useCreateSectionMutation, useCreateWorkspaceMutation, useUpdateProjectMutation, useUpdateSectionMutation, useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';

type ContextItem = { label: string; href: string };
type ContextConfig = { title: string; items: ContextItem[]; section?: string };
type CreateKind = 'space' | LocalSpaceItemKind;

const contexts: Record<GlobalModulePath, ContextConfig> = {
  '/dashboard': { title: 'Home', items: [{ label: 'Overview', href: '/dashboard' }, { label: 'Recent activity', href: '/dashboard?view=activity' }, { label: 'Upcoming', href: '/dashboard?view=upcoming' }] },
  '/projects': { title: 'Spaces', items: [{ label: 'All Tasks', href: '/my-tasks' }, { label: 'Shared with me', href: '/projects?view=shared' }], section: 'Spaces' },
  '/my-tasks': { title: 'My Tasks', items: [{ label: 'Today', href: '/my-tasks' }, { label: 'Upcoming', href: '/my-tasks?view=upcoming' }, { label: 'Completed', href: '/my-tasks?view=completed' }] },
  '/calendar': { title: 'Planner', items: [{ label: 'Calendar', href: '/calendar' }, { label: 'Schedule', href: '/calendar?view=schedule' }, { label: 'Focus', href: '/calendar?view=focus' }] },
  '/time-tracking': { title: 'Time', items: [{ label: 'Timer', href: '/time-tracking' }, { label: 'Timesheet', href: '/time-tracking?view=timesheet' }, { label: 'Weekly summary', href: '/time-tracking?view=weekly' }] },
  '/reports': { title: 'Reports', items: [{ label: 'Overview', href: '/reports' }, { label: 'Project health', href: '/reports?view=health' }, { label: 'Time report', href: '/reports?view=time' }] },
  '/settings': { title: 'Settings', items: [{ label: 'General', href: '/settings' }, { label: 'Workspace', href: '/settings?view=workspace' }, { label: 'Notifications', href: '/settings?view=notifications' }] },
};

const creationOptions: Array<{ kind: CreateKind; label: string; description: string; icon: typeof Folder }> = [
  { kind: 'space', label: 'Space', description: 'Organize your team work', icon: PanelTop },
  { kind: 'folder', label: 'Folder', description: 'Group Lists, Docs and more', icon: Folder },
  { kind: 'list', label: 'List', description: 'Track tasks and projects', icon: ListChecks },
  { kind: 'doc', label: 'Doc', description: 'Create shared documentation', icon: FileText },
];

const itemIcon = (kind: LocalSpaceItemKind) => kind === 'folder' ? Folder : kind === 'list' ? ListChecks : kind === 'dashboard' ? LayoutDashboard : kind === 'doc' ? FileText : PanelTop;

type ContextSidebarProps = { modulePath?: GlobalModulePath; preview?: boolean; onCollapse?: () => void };

export function ContextSidebar({ modulePath, preview = false, onCollapse }: ContextSidebarProps) {
  const pathname = usePathname();
  const routeModulePath = pathname in contexts ? pathname as GlobalModulePath : '/dashboard';
  const context = contexts[modulePath ?? routeModulePath];
  const isSpaces = context.title === 'Spaces';
  const [spaces, setSpaces] = useState(defaultLocalSpaces);
  const [activeSpaceId, setActiveSpaceId] = useState(defaultLocalSpaces[0].id);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [spacesSearchOpen, setSpacesSearchOpen] = useState(false);
  const [spacesSearchQuery, setSpacesSearchQuery] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [createKind, setCreateKind] = useState<CreateKind>('space');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [parentSpaceId, setParentSpaceId] = useState(defaultLocalSpaces[0].id);
  const [parentItemId, setParentItemId] = useState<string | undefined>();
  const [projectMenuId, setProjectMenuId] = useState<string | null>(null);
  const [spaceMenuId, setSpaceMenuId] = useState<string | null>(null);
  const [listMenuId, setListMenuId] = useState<string | null>(null);
  const [spaceCreateMenuId, setSpaceCreateMenuId] = useState<string | null>(null);
  const [folderCreateMenuId, setFolderCreateMenuId] = useState<string | null>(null);
  const [expandedSpaceIds, setExpandedSpaceIds] = useState<Set<string>>(() => new Set([defaultLocalSpaces[0].id]));
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set(['folder-projects']));
  const navigationQuery = useWorkspaceNavigationQuery(isSpaces);
  const effectiveSpaces = navigationQuery.data ?? spaces;
  const createWorkspaceMutation = useCreateWorkspaceMutation();
  const createProjectMutation = useCreateProjectMutation();
  const updateProjectMutation = useUpdateProjectMutation();
  const archiveProjectMutation = useArchiveProjectMutation();
  const createSectionMutation = useCreateSectionMutation();
  const updateSectionMutation = useUpdateSectionMutation();
  const archiveSectionMutation = useArchiveSectionMutation();

  useEffect(() => {
    const savedSpaces = loadLocalSpaces();
    // Local storage and URL state are external sources hydrated once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpaces(savedSpaces);
    const parameters = new URLSearchParams(window.location.search);
    setActiveSpaceId(parameters.get('space') ?? savedSpaces[0]?.id ?? '');
    setActiveFolderId(parameters.get('list') || parameters.get('doc') ? null : parameters.get('folder'));
    setActiveListId(parameters.get('doc') ? null : parameters.get('list'));
    setActiveDocId(parameters.get('doc'));
    setParentSpaceId(parameters.get('space') ?? savedSpaces[0]?.id ?? '');
    setHydrated(true);
  }, []);
  useEffect(() => {
    const synchronizeSpaces = () => {
      const savedSpaces = loadLocalSpaces();
      setSpaces((current) => JSON.stringify(current) === JSON.stringify(savedSpaces) ? current : savedSpaces);
    };
    window.addEventListener('clickflow:local-spaces-changed', synchronizeSpaces);
    return () => window.removeEventListener('clickflow:local-spaces-changed', synchronizeSpaces);
  }, []);
  useEffect(() => { if (hydrated) saveLocalSpaces(spaces); }, [hydrated, spaces]);

  const toggleTree = (id: string, setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const navigateToSpace = (spaceId: string, folderId?: string, listId?: string) => {
    const url = new URL(window.location.href);
    url.pathname = '/projects';
    url.searchParams.set('space', spaceId);
    url.searchParams.delete('doc');
    if (folderId) url.searchParams.set('folder', folderId); else url.searchParams.delete('folder');
    if (listId) url.searchParams.set('list', listId); else url.searchParams.delete('list');
    window.history.pushState(null, '', url);
    setActiveSpaceId(spaceId);
    setActiveFolderId(listId ? null : folderId ?? null);
    setActiveListId(listId ?? null);
    setActiveDocId(null);
    setExpandedSpaceIds((current) => new Set([...current, spaceId]));
    window.dispatchEvent(new Event('clickflow:space-navigation'));
  };
  const navigateToDocument = (spaceId: string, folderId: string | undefined, docId: string) => {
    const url = new URL(window.location.href);
    url.pathname = '/projects';
    url.searchParams.set('space', spaceId);
    url.searchParams.delete('doc');
    if (folderId) url.searchParams.set('folder', folderId); else url.searchParams.delete('folder');
    url.searchParams.delete('list');
    url.searchParams.set('doc', docId);
    window.history.pushState(null, '', url.pathname + url.search);
    setActiveSpaceId(spaceId);
    setActiveFolderId(null);
    setActiveListId(null);
    setActiveDocId(docId);
    setExpandedSpaceIds((current) => new Set([...current, spaceId]));
    if (folderId) setExpandedFolderIds((current) => new Set([...current, folderId]));
    window.dispatchEvent(new Event('clickflow:space-navigation'));
  };
  const beginCreate = (kind: CreateKind) => {
    setCreateKind(kind);
    setNewName('');
    setParentSpaceId(activeSpaceId || effectiveSpaces[0]?.id || '');
    setParentItemId(undefined);
    setShowCreateMenu(false);
    setCreateOpen(true);
  };
  const beginCreateInSpace = (kind: LocalSpaceItemKind, spaceId: string) => {
    setCreateKind(kind);
    setNewName('');
    setParentSpaceId(spaceId);
    setParentItemId(undefined);
    setSpaceCreateMenuId(null);
    setCreateOpen(true);
  };
  const beginCreateInFolder = (kind: LocalSpaceItemKind, spaceId: string, folderId: string) => {
    setCreateKind(kind);
    setNewName('');
    setParentSpaceId(spaceId);
    setParentItemId(folderId);
    setFolderCreateMenuId(null);
    setCreateOpen(true);
  };
  const runSpaceAction = (action: string, spaceId: string) => {
    const space = effectiveSpaces.find((item) => item.id === spaceId);
    if (!space) return;
    if (action === 'copy-link') {
      void navigator.clipboard?.writeText(`${window.location.origin}/projects?space=${spaceId}`);
    } else {
      toast.info('Workspace management is not available in the current API yet.');
    }
    setSpaceMenuId(null);
  };
  const runListAction = (action: string, spaceId: string, listId: string) => {
    const space = effectiveSpaces.find((item) => item.id === spaceId);
    const list = space?.items.find((item) => item.id === listId);
    if (!list?.parentId) return;
    if (action === 'rename') {
      const nextName = window.prompt('Rename List', list.name)?.trim();
      if (nextName) void updateSectionMutation.mutateAsync({ workspaceId: spaceId, projectId: list.parentId, sectionId: listId, name: nextName }).catch(() => toast.error('Unable to rename this List.'));
    } else if (action === 'copy-link') {
      void navigator.clipboard?.writeText(`${window.location.origin}/projects?space=${spaceId}&folder=${list.parentId}&list=${listId}`);
    } else if (action === 'duplicate') {
      void createSectionMutation.mutateAsync({ workspaceId: spaceId, projectId: list.parentId, input: { name: `${list.name} copy` } }).catch(() => toast.error('Unable to duplicate this List.'));
    } else if (action === 'delete') {
      void archiveSectionMutation.mutateAsync({ workspaceId: spaceId, projectId: list.parentId, sectionId: listId }).catch(() => toast.error('Unable to archive this List.'));
    }
    setListMenuId(null);
  };
  const runProjectAction = (action: string, spaceId: string, folderId: string) => {
    const space = effectiveSpaces.find((item) => item.id === spaceId);
    const folder = space?.items.find((item) => item.id === folderId);
    if (!folder) return;
    if (action === 'rename') {
      const nextName = window.prompt('Rename Project', folder.name)?.trim();
      if (nextName) void updateProjectMutation.mutateAsync({ workspaceId: spaceId, projectId: folderId, name: nextName }).catch(() => toast.error('Unable to rename this Project.'));
    } else if (action === 'copy-link') {
      void navigator.clipboard?.writeText(`${window.location.origin}/projects?space=${spaceId}&folder=${folderId}`);
    } else if (action === 'duplicate') {
      void createProjectMutation.mutateAsync({ workspaceId: spaceId, input: { name: `${folder.name} copy` } }).catch(() => toast.error('Unable to duplicate this Project.'));
    } else if (action === 'archive' || action === 'delete') {
      void archiveProjectMutation.mutateAsync({ workspaceId: spaceId, projectId: folderId }).catch(() => toast.error('Unable to archive this Project.'));
    } else if (action === 'create-list') {
      beginCreateInFolder('list', spaceId, folderId);
    }
    setProjectMenuId(null);
  };
  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (
      createWorkspaceMutation.isPending ||
      createProjectMutation.isPending ||
      createSectionMutation.isPending
    ) return;
    if (!navigationQuery.usesApi) {
      if (createKind === 'space') {
        const id = localId('space');
        setSpaces((current) => [...current, { id, name, tone: nextSpaceTone(current.length), private: true, items: [] }]);
        setActiveSpaceId(id);
      } else {
        setSpaces((current) => current.map((space) => space.id === parentSpaceId ? { ...space, items: [...space.items, { id: localId(createKind), name, kind: createKind, ...(parentItemId ? { parentId: parentItemId } : {}) }] } : space));
        setActiveSpaceId(parentSpaceId);
      }
      setCreateOpen(false);
      return;
    }
    if (createKind === 'space') {
      try {
        const workspace = await createWorkspaceMutation.mutateAsync({ name });
        setActiveSpaceId(workspace.id);
        setParentSpaceId(workspace.id);
        setExpandedSpaceIds((current) => new Set([...current, workspace.id]));
        setCreateOpen(false);
        navigateToSpace(workspace.id);
        toast.success('Workspace created.');
      } catch {
        toast.error('Unable to create this Workspace.');
        return;
      }
    } else if (createKind === 'folder') {
      void createProjectMutation.mutateAsync({ workspaceId: parentSpaceId, input: { name } }).catch(() => toast.error('Unable to create this Project.'));
    } else if (createKind === 'list' && parentItemId) {
      void createSectionMutation.mutateAsync({ workspaceId: parentSpaceId, projectId: parentItemId, input: { name } }).catch(() => toast.error('Unable to create this List.'));
      setActiveSpaceId(parentSpaceId);
    } else if (createKind === 'list') {
      toast.error('Choose a Project before creating a List.');
      return;
    } else {
      toast.info('Document creation will be connected in a later integration task.');
      return;
    }
    setCreateOpen(false);
  };

  const normalizedSpacesSearch = spacesSearchQuery.trim().toLocaleLowerCase();
  const hasSpacesSearch = isSpaces && normalizedSpacesSearch.length > 0;
  const matchesSpacesSearch = (name: string) => name.toLocaleLowerCase().includes(normalizedSpacesSearch);
  return <aside onClick={(event) => { if (!(event.target as HTMLElement).closest('[data-options-menu], [data-options-trigger]')) { setProjectMenuId(null); setSpaceMenuId(null); setListMenuId(null); setSpaceCreateMenuId(null); setFolderCreateMenuId(null); } }} aria-label={`${context.title} ${preview ? 'preview' : 'navigation'}`} className={`glass-shell hidden h-screen w-72 shrink-0 flex-col border-r border-white/30 p-3 md:flex ${preview ? 'absolute left-0 top-0 z-20 rounded-r-2xl border border-white/45 shadow-2xl shadow-slate-950/20' : ''}`}>
    <div className="relative flex items-center justify-between gap-2"><h2 className="text-base font-semibold">{context.title}</h2><div className="flex items-center gap-1"><Button aria-label={`Search ${context.title}`} variant="ghost" size="sm" onClick={() => { if (!isSpaces) return; setSpacesSearchOpen((open) => !open); setSpacesSearchQuery(''); }}><Search size={17} /></Button><Button aria-label="Collapse panel" variant="ghost" size="sm" onClick={onCollapse}><ChevronsLeft size={17} /></Button><Button aria-label={`Create ${isSpaces ? 'space' : 'new item'}`} size="sm" onClick={() => isSpaces ? setShowCreateMenu((open) => !open) : notifyToastPreview}><Plus size={17} /></Button></div>{isSpaces && showCreateMenu && <div role="menu" data-options-menu className="absolute right-0 top-10 z-30 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><p className="px-2 py-1 text-xs font-semibold text-slate-500">Create</p>{creationOptions.map(({ kind, label, description, icon: Icon }) => <button type="button" role="menuitem" key={kind} onClick={() => beginCreate(kind)} className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"><Icon size={17} className="mt-0.5 shrink-0 text-slate-500" /><span><span className="block text-sm font-medium">{label}</span><span className="block text-xs text-slate-500">{description}</span></span></button>)}</div>}</div>
    {isSpaces && spacesSearchOpen && <label className="relative mt-3 block"><Search aria-hidden="true" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus aria-label="Search Spaces tree" value={spacesSearchQuery} onChange={(event) => setSpacesSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { setSpacesSearchQuery(''); setSpacesSearchOpen(false); } }} placeholder="Search Spaces" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" /></label>}    <nav className="mt-5 space-y-1">{context.items.map((item) => <Link key={item.label} href={item.href} aria-current={item.href === pathname ? 'page' : undefined} className={`block rounded-lg px-3 py-2 text-sm transition ${item.href === pathname ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-600 hover:bg-white/55 dark:text-slate-300 dark:hover:bg-slate-800/70'}`}>{item.label}</Link>)}</nav>
    {isSpaces && <><div className="my-4 border-t border-white/40 dark:border-slate-700/60" /><div className="flex items-center justify-between px-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{context.section}</p><button type="button" aria-label="Create a new Space" onClick={() => beginCreate('space')} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><Plus size={15} /></button></div><nav className="mt-2 space-y-1">{navigationQuery.isLoading && <p role="status" className="px-3 py-2 text-xs text-slate-500">Loading workspaces...</p>}{navigationQuery.isError && <p role="alert" className="px-3 py-2 text-xs text-rose-600">Unable to load workspaces.</p>}{!navigationQuery.isLoading && !navigationQuery.isError && effectiveSpaces.length === 0 && <p className="px-3 py-2 text-xs text-slate-500">No workspaces available.</p>}{effectiveSpaces.filter((space) => !hasSpacesSearch || matchesSpacesSearch(space.name) || space.items.some((item) => matchesSpacesSearch(item.name))).map((space) => <div key={space.id}><div className="relative flex items-center">{space.items.length > 0 && <button type="button" aria-label={`${expandedSpaceIds.has(space.id) ? 'Collapse' : 'Expand'} ${space.name}`} onClick={() => toggleTree(space.id, setExpandedSpaceIds)} className="ml-1 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">{(expandedSpaceIds.has(space.id) || hasSpacesSearch) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>}<Link href={`/projects?space=${space.id}`} onClick={(event) => { event.preventDefault(); navigateToSpace(space.id); }} aria-current={space.id === activeSpaceId && !activeFolderId && !activeListId && !activeDocId ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${space.id === activeSpaceId && !activeFolderId && !activeListId && !activeDocId ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-600 hover:bg-white/55 dark:text-slate-300 dark:hover:bg-slate-800/70'}`}><span className={`h-5 w-5 rounded-md ${space.tone}`} /><span className="truncate">{space.name}</span>{space.private && <span className="ml-auto text-xs font-normal text-slate-400">Private</span>}</Link><button type="button" data-options-trigger aria-label={`Create in ${space.name}`} onClick={() => { setSpaceCreateMenuId((current) => current === space.id ? null : space.id); setSpaceMenuId(null); setProjectMenuId(null); setListMenuId(null); }} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><Plus size={15} /></button>{spaceCreateMenuId === space.id && <div role="menu" data-options-menu className="absolute right-2 top-8 z-40 w-48 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><p className="px-3 py-1 text-xs font-semibold text-slate-500">Create in Space</p><button type="button" role="menuitem" onClick={() => beginCreateInSpace('folder', space.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Folder size={15} />Folder</button><button type="button" role="menuitem" onClick={() => beginCreateInSpace('list', space.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><ListChecks size={15} />List</button><button type="button" role="menuitem" onClick={() => beginCreateInSpace('doc', space.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><FileText size={15} />Doc</button></div>}<button type="button" data-options-trigger aria-label={`More options for ${space.name}`} onClick={() => { setSpaceMenuId((current) => current === space.id ? null : space.id); setProjectMenuId(null); setListMenuId(null); setSpaceCreateMenuId(null); }} className="mr-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button>{spaceMenuId === space.id && <div role="menu" data-options-menu className="absolute left-8 top-8 z-40 w-48 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={() => runSpaceAction('rename', space.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Rename</button><button type="button" role="menuitem" onClick={() => runSpaceAction('copy-link', space.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => runSpaceAction('duplicate', space.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><button type="button" role="menuitem" onClick={() => runSpaceAction('delete', space.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button></div>}</div>{(expandedSpaceIds.has(space.id) || hasSpacesSearch) && space.items.filter((item) => !item.parentId && (!hasSpacesSearch || matchesSpacesSearch(item.name) || space.items.some((child) => child.parentId === item.id && matchesSpacesSearch(child.name)))).map((item) => { const Icon = itemIcon(item.kind); const childLists = space.items.filter((child) => child.parentId === item.id); return item.kind === 'folder' ? <div key={item.id}><div className="relative flex items-center gap-1">{childLists.length > 0 ? <button type="button" aria-label={`${expandedFolderIds.has(item.id) ? 'Collapse' : 'Expand'} ${item.name}`} onClick={() => toggleTree(item.id, setExpandedFolderIds)} className="ml-7 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">{(expandedFolderIds.has(item.id) || hasSpacesSearch) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button> : <span className="ml-7 w-[18px]" />}<button type="button" onClick={() => { navigateToSpace(space.id, item.id); setExpandedFolderIds((current) => new Set([...current, item.id])); }} aria-current={item.id === activeFolderId ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-1 pr-1 text-left text-sm transition ${item.id === activeFolderId ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}><Icon size={15} />{item.name}</button><div className="mr-2 flex items-center"><button type="button" data-options-trigger aria-label={`Create in ${item.name}`} onClick={() => { setFolderCreateMenuId((current) => current === item.id ? null : item.id); setProjectMenuId(null); setListMenuId(null); setSpaceMenuId(null); setSpaceCreateMenuId(null); }} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><Plus size={15} /></button>{folderCreateMenuId === item.id && <div role="menu" data-options-menu className="absolute right-8 top-8 z-40 w-48 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><p className="px-3 py-1 text-xs font-semibold text-slate-500">Create in Folder</p><button type="button" role="menuitem" onClick={() => beginCreateInFolder('list', space.id, item.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><ListChecks size={15} />List</button><button type="button" role="menuitem" onClick={() => beginCreateInFolder('doc', space.id, item.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><FileText size={15} />Doc</button></div>}<button type="button" data-options-trigger aria-label={`More options for ${item.name}`} onClick={() => { setProjectMenuId((current) => current === item.id ? null : item.id); setSpaceMenuId(null); setListMenuId(null); setSpaceCreateMenuId(null); }} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button></div>{projectMenuId === item.id && <div role="menu" data-options-menu className="absolute left-10 top-8 z-40 w-56 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={() => runProjectAction('rename', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Rename</button><button type="button" role="menuitem" onClick={() => runProjectAction('copy-link', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => runProjectAction('duplicate', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><button type="button" role="menuitem" onClick={() => runProjectAction('delete', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button></div>}</div>{(expandedFolderIds.has(item.id) || hasSpacesSearch) && childLists.filter((child) => !hasSpacesSearch || matchesSpacesSearch(child.name)).map((child) => { const ChildIcon = itemIcon(child.kind); return <div key={child.id} className="relative flex items-center"><button type="button" onClick={() => child.kind === 'doc' ? navigateToDocument(space.id, item.id, child.id) : navigateToSpace(space.id, item.id, child.id)} aria-current={child.kind === 'doc' ? child.id === activeDocId ? 'page' : undefined : child.id === activeListId ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-[3.8rem] pr-1 text-left text-sm transition ${(child.kind === 'doc' ? child.id === activeDocId : child.id === activeListId) ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}><ChildIcon size={14} />{child.name}</button><button type="button" data-options-trigger aria-label={`More options for ${child.name}`} onClick={() => { setListMenuId((current) => current === child.id ? null : child.id); setProjectMenuId(null); setSpaceMenuId(null); setSpaceCreateMenuId(null); }} className="mr-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button>{listMenuId === child.id && <div role="menu" data-options-menu className="absolute left-12 top-8 z-40 w-44 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={() => runListAction('rename', space.id, child.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Rename</button><button type="button" role="menuitem" onClick={() => runListAction('copy-link', space.id, child.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => runListAction('duplicate', space.id, child.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><button type="button" role="menuitem" onClick={() => runListAction('delete', space.id, child.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button></div>}</div>; })}</div> : item.kind === 'list' ? <div key={item.id} className="relative flex items-center"><button type="button" onClick={() => navigateToSpace(space.id, undefined, item.id)} aria-current={item.id === activeListId ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-11 pr-1 text-left text-sm transition ${item.id === activeListId ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}><Icon size={15} />{item.name}</button><button type="button" data-options-trigger aria-label={`More options for ${item.name}`} onClick={() => { setListMenuId((current) => current === item.id ? null : item.id); setProjectMenuId(null); setSpaceMenuId(null); setSpaceCreateMenuId(null); }} className="mr-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button>{listMenuId === item.id && <div role="menu" data-options-menu className="absolute left-12 top-8 z-40 w-44 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={() => runListAction('rename', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Rename</button><button type="button" role="menuitem" onClick={() => runListAction('copy-link', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => runListAction('duplicate', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><button type="button" role="menuitem" onClick={() => runListAction('delete', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button></div>}</div> : <button key={item.id} type="button" onClick={() => item.kind === 'doc' ? navigateToDocument(space.id, item.parentId, item.id) : notifyToastPreview()} aria-current={item.kind === 'doc' && item.id === activeDocId ? 'page' : undefined} className={`flex w-full items-center gap-2 rounded-lg py-1.5 pl-11 pr-3 text-left text-sm transition ${item.kind === 'doc' && item.id === activeDocId ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}><Icon size={15} />{item.name}</button>; })}</div>)}</nav></>}
    <Dialog open={createOpen} onOpenChange={setCreateOpen}><form onSubmit={submitCreate} className="space-y-4"><DialogTitle>Create {createKind === 'space' ? 'Space' : createKind}</DialogTitle><label className="block text-sm font-medium">{createKind === 'space' ? 'Space name' : `${createKind[0].toUpperCase()}${createKind.slice(1)} name`}<input autoFocus aria-label={createKind === 'space' ? 'Space name' : `${createKind} name`} value={newName} onChange={(event) => setNewName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" /></label>{parentItemId && <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">This List will be created in the selected Project.</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={createProjectMutation.isPending || createSectionMutation.isPending}>Create</Button></div></form></Dialog>
  </aside>;
}