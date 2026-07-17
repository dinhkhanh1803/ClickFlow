'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, ChevronsLeft, FileText, Folder, LayoutDashboard, ListChecks, MoreHorizontal, PanelTop, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { notifyToastPreview } from '@/lib/feedback/toast-feedback';
import { defaultLocalSpaces, loadLocalSpaces, localId, nextSpaceTone, saveLocalSpaces, type LocalSpaceItemKind } from '@/features/workspace/model/local-navigation';
import type { GlobalModulePath } from '@/components/layout/app-sidebar';

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
  { kind: 'dashboard', label: 'Dashboard', description: 'Visualize your work', icon: LayoutDashboard },
  { kind: 'whiteboard', label: 'Whiteboard', description: 'Plan visually with your team', icon: PanelTop },
  { kind: 'form', label: 'Form', description: 'Collect requests and feedback', icon: ListChecks },
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

  useEffect(() => {
    const savedSpaces = loadLocalSpaces();
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
    setParentSpaceId(activeSpaceId || spaces[0]?.id || '');
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
    const space = spaces.find((item) => item.id === spaceId);
    if (!space) return;
    if (action === 'rename') {
      const nextName = window.prompt('Rename Space', space.name)?.trim();
      if (nextName) setSpaces((current) => current.map((item) => item.id === spaceId ? { ...item, name: nextName } : item));
    } else if (action === 'copy-link') {
      void navigator.clipboard?.writeText(`${window.location.origin}/projects?space=${spaceId}`);
    } else if (action === 'duplicate') {
      setSpaces((current) => [...current, { ...space, id: localId('space'), name: `${space.name} copy`, tone: nextSpaceTone(current.length), items: space.items.map((item) => ({ ...item, id: localId(item.kind) })) }]);
    } else if (action === 'delete') {
      setSpaces((current) => current.filter((item) => item.id !== spaceId));
      if (activeSpaceId === spaceId) setActiveSpaceId(spaces.find((item) => item.id !== spaceId)?.id ?? '');
    }
    setSpaceMenuId(null);
  };
  const runListAction = (action: string, spaceId: string, listId: string) => {
    const space = spaces.find((item) => item.id === spaceId);
    const list = space?.items.find((item) => item.id === listId);
    if (!list) return;
    if (action === 'rename') {
      const nextName = window.prompt('Rename List', list.name)?.trim();
      if (nextName) setSpaces((current) => current.map((item) => item.id === spaceId ? { ...item, items: item.items.map((child) => child.id === listId ? { ...child, name: nextName } : child) } : item));
    } else if (action === 'copy-link') {
      void navigator.clipboard?.writeText(`${window.location.origin}/projects?space=${spaceId}&list=${listId}`);
    } else if (action === 'duplicate') {
      setSpaces((current) => current.map((item) => item.id === spaceId ? { ...item, items: [...item.items, { ...list, id: localId('list'), name: `${list.name} copy` }] } : item));
    } else if (action === 'delete') {
      setSpaces((current) => current.map((item) => item.id === spaceId ? { ...item, items: item.items.filter((child) => child.id !== listId) } : item));
    }
    setListMenuId(null);
  };
  const runProjectAction = (action: string, spaceId: string, folderId: string) => {
    const space = spaces.find((item) => item.id === spaceId);
    const folder = space?.items.find((item) => item.id === folderId);
    if (!folder) return;
    if (action === 'rename') {
      const nextName = window.prompt('Rename Project', folder.name)?.trim();
      if (nextName) setSpaces((current) => current.map((item) => item.id === spaceId ? { ...item, items: item.items.map((child) => child.id === folderId ? { ...child, name: nextName } : child) } : item));
    } else if (action === 'copy-link') {
      void navigator.clipboard?.writeText(`${window.location.origin}/projects?space=${spaceId}&project=${folderId}`);
    } else if (action === 'duplicate') {
      setSpaces((current) => current.map((item) => item.id === spaceId ? { ...item, items: [...item.items, { ...folder, id: localId('folder'), name: `${folder.name} copy` }] } : item));
    } else if (action === 'archive' || action === 'delete') {
      setSpaces((current) => current.map((item) => item.id === spaceId ? { ...item, items: item.items.filter((child) => child.id !== folderId && child.parentId !== folderId) } : item));
    } else if (action === 'create-list') {
      beginCreateInFolder('list', spaceId, folderId);
    } else {
      notifyToastPreview();
    }
    setProjectMenuId(null);
  };
  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (createKind === 'space') {
      const id = localId('space');
      setSpaces((current) => [...current, { id, name, tone: nextSpaceTone(current.length), private: true, items: [] }]);
      setActiveSpaceId(id);
    } else {
      setSpaces((current) => current.map((space) => space.id === parentSpaceId ? { ...space, items: [...space.items, { id: localId(createKind), name, kind: createKind, ...(parentItemId ? { parentId: parentItemId } : {}) }] } : space));
      setActiveSpaceId(parentSpaceId);
    }
    setCreateOpen(false);
  };

  return <aside onClick={(event) => { if (!(event.target as HTMLElement).closest('[data-options-menu], [data-options-trigger]')) { setProjectMenuId(null); setSpaceMenuId(null); setListMenuId(null); setSpaceCreateMenuId(null); setFolderCreateMenuId(null); } }} aria-label={`${context.title} ${preview ? 'preview' : 'navigation'}`} className={`glass-shell hidden h-screen w-72 shrink-0 flex-col border-r border-white/30 p-3 md:flex ${preview ? 'absolute left-0 top-0 z-20 rounded-r-2xl border border-white/45 shadow-2xl shadow-slate-950/20' : ''}`}>
    <div className="relative flex items-center justify-between gap-2"><h2 className="text-base font-semibold">{context.title}</h2><div className="flex items-center gap-1"><Button aria-label={`${context.title} options`} variant="ghost" size="sm"><MoreHorizontal size={17} /></Button><Button aria-label={`Search ${context.title}`} variant="ghost" size="sm"><Search size={17} /></Button><Button aria-label="Collapse panel" variant="ghost" size="sm" onClick={onCollapse}><ChevronsLeft size={17} /></Button><Button aria-label={`Create ${isSpaces ? 'space' : 'new item'}`} size="sm" onClick={() => isSpaces ? setShowCreateMenu((open) => !open) : notifyToastPreview}><Plus size={17} /></Button></div>{isSpaces && showCreateMenu && <div role="menu" data-options-menu className="absolute right-0 top-10 z-30 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><p className="px-2 py-1 text-xs font-semibold text-slate-500">Create</p>{creationOptions.map(({ kind, label, description, icon: Icon }) => <button type="button" role="menuitem" key={kind} onClick={() => beginCreate(kind)} className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"><Icon size={17} className="mt-0.5 shrink-0 text-slate-500" /><span><span className="block text-sm font-medium">{label}</span><span className="block text-xs text-slate-500">{description}</span></span></button>)}</div>}</div>
    <nav className="mt-5 space-y-1">{context.items.map((item) => <Link key={item.label} href={item.href} aria-current={item.href === pathname ? 'page' : undefined} className={`block rounded-lg px-3 py-2 text-sm transition ${item.href === pathname ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-600 hover:bg-white/55 dark:text-slate-300 dark:hover:bg-slate-800/70'}`}>{item.label}</Link>)}</nav>
    {isSpaces && <><div className="my-4 border-t border-white/40 dark:border-slate-700/60" /><div className="flex items-center justify-between px-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{context.section}</p><button type="button" aria-label="Create a new Space" onClick={() => beginCreate('space')} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><Plus size={15} /></button></div><nav className="mt-2 space-y-1">{spaces.map((space) => <div key={space.id}><div className="relative flex items-center">{space.items.length > 0 && <button type="button" aria-label={`${expandedSpaceIds.has(space.id) ? 'Collapse' : 'Expand'} ${space.name}`} onClick={() => toggleTree(space.id, setExpandedSpaceIds)} className="ml-1 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">{expandedSpaceIds.has(space.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>}<Link href={`/projects?space=${space.id}`} onClick={(event) => { event.preventDefault(); navigateToSpace(space.id); }} aria-current={space.id === activeSpaceId && !activeFolderId && !activeListId && !activeDocId ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${space.id === activeSpaceId && !activeFolderId && !activeListId && !activeDocId ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-600 hover:bg-white/55 dark:text-slate-300 dark:hover:bg-slate-800/70'}`}><span className={`h-5 w-5 rounded-md ${space.tone}`} /><span className="truncate">{space.name}</span>{space.private && <span className="ml-auto text-xs font-normal text-slate-400">Private</span>}</Link><button type="button" data-options-trigger aria-label={`Create in ${space.name}`} onClick={() => { setSpaceCreateMenuId((current) => current === space.id ? null : space.id); setSpaceMenuId(null); setProjectMenuId(null); setListMenuId(null); }} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><Plus size={15} /></button>{spaceCreateMenuId === space.id && <div role="menu" data-options-menu className="absolute right-2 top-8 z-40 w-48 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><p className="px-3 py-1 text-xs font-semibold text-slate-500">Create in Space</p><button type="button" role="menuitem" onClick={() => beginCreateInSpace('folder', space.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Folder size={15} />Folder</button><button type="button" role="menuitem" onClick={() => beginCreateInSpace('list', space.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><ListChecks size={15} />List</button><button type="button" role="menuitem" onClick={() => beginCreateInSpace('doc', space.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><FileText size={15} />Doc</button></div>}<button type="button" data-options-trigger aria-label={`More options for ${space.name}`} onClick={() => { setSpaceMenuId((current) => current === space.id ? null : space.id); setProjectMenuId(null); setListMenuId(null); setSpaceCreateMenuId(null); }} className="mr-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button>{spaceMenuId === space.id && <div role="menu" data-options-menu className="absolute left-8 top-8 z-40 w-48 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={() => runSpaceAction('rename', space.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Rename</button><button type="button" role="menuitem" onClick={() => runSpaceAction('copy-link', space.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => runSpaceAction('duplicate', space.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><button type="button" role="menuitem" onClick={() => runSpaceAction('delete', space.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button></div>}</div>{expandedSpaceIds.has(space.id) && space.items.filter((item) => !item.parentId).map((item) => { const Icon = itemIcon(item.kind); const childLists = space.items.filter((child) => child.parentId === item.id); return item.kind === 'folder' ? <div key={item.id}><div className="relative flex items-center gap-1">{childLists.length > 0 ? <button type="button" aria-label={`${expandedFolderIds.has(item.id) ? 'Collapse' : 'Expand'} ${item.name}`} onClick={() => toggleTree(item.id, setExpandedFolderIds)} className="ml-7 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">{expandedFolderIds.has(item.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button> : <span className="ml-7 w-[18px]" />}<button type="button" onClick={() => { navigateToSpace(space.id, item.id); setExpandedFolderIds((current) => new Set([...current, item.id])); }} aria-current={item.id === activeFolderId ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-1 pr-1 text-left text-sm transition ${item.id === activeFolderId ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}><Icon size={15} />{item.name}</button><div className="mr-2 flex items-center"><button type="button" data-options-trigger aria-label={`Create in ${item.name}`} onClick={() => { setFolderCreateMenuId((current) => current === item.id ? null : item.id); setProjectMenuId(null); setListMenuId(null); setSpaceMenuId(null); setSpaceCreateMenuId(null); }} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><Plus size={15} /></button>{folderCreateMenuId === item.id && <div role="menu" data-options-menu className="absolute right-8 top-8 z-40 w-48 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><p className="px-3 py-1 text-xs font-semibold text-slate-500">Create in Folder</p><button type="button" role="menuitem" onClick={() => beginCreateInFolder('list', space.id, item.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><ListChecks size={15} />List</button><button type="button" role="menuitem" onClick={() => beginCreateInFolder('doc', space.id, item.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><FileText size={15} />Doc</button></div>}<button type="button" data-options-trigger aria-label={`More options for ${item.name}`} onClick={() => { setProjectMenuId((current) => current === item.id ? null : item.id); setSpaceMenuId(null); setListMenuId(null); setSpaceCreateMenuId(null); }} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button></div>{projectMenuId === item.id && <div role="menu" data-options-menu className="absolute left-10 top-8 z-40 w-56 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={() => runProjectAction('rename', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Rename</button><button type="button" role="menuitem" onClick={() => runProjectAction('copy-link', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => runProjectAction('duplicate', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><button type="button" role="menuitem" onClick={() => runProjectAction('delete', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button></div>}</div>{expandedFolderIds.has(item.id) && childLists.map((child) => { const ChildIcon = itemIcon(child.kind); return <div key={child.id} className="relative flex items-center"><button type="button" onClick={() => child.kind === 'doc' ? navigateToDocument(space.id, item.id, child.id) : navigateToSpace(space.id, item.id, child.id)} aria-current={child.kind === 'doc' ? child.id === activeDocId ? 'page' : undefined : child.id === activeListId ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-[3.8rem] pr-1 text-left text-sm transition ${(child.kind === 'doc' ? child.id === activeDocId : child.id === activeListId) ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}><ChildIcon size={14} />{child.name}</button><button type="button" data-options-trigger aria-label={`More options for ${child.name}`} onClick={() => { setListMenuId((current) => current === child.id ? null : child.id); setProjectMenuId(null); setSpaceMenuId(null); setSpaceCreateMenuId(null); }} className="mr-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button>{listMenuId === child.id && <div role="menu" data-options-menu className="absolute left-12 top-8 z-40 w-44 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={() => runListAction('rename', space.id, child.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Rename</button><button type="button" role="menuitem" onClick={() => runListAction('copy-link', space.id, child.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => runListAction('duplicate', space.id, child.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><button type="button" role="menuitem" onClick={() => runListAction('delete', space.id, child.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button></div>}</div>; })}</div> : item.kind === 'list' ? <div key={item.id} className="relative flex items-center"><button type="button" onClick={() => navigateToSpace(space.id, undefined, item.id)} aria-current={item.id === activeListId ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-11 pr-1 text-left text-sm transition ${item.id === activeListId ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}><Icon size={15} />{item.name}</button><button type="button" data-options-trigger aria-label={`More options for ${item.name}`} onClick={() => { setListMenuId((current) => current === item.id ? null : item.id); setProjectMenuId(null); setSpaceMenuId(null); setSpaceCreateMenuId(null); }} className="mr-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button>{listMenuId === item.id && <div role="menu" data-options-menu className="absolute left-12 top-8 z-40 w-44 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={() => runListAction('rename', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Rename</button><button type="button" role="menuitem" onClick={() => runListAction('copy-link', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => runListAction('duplicate', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><button type="button" role="menuitem" onClick={() => runListAction('delete', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button></div>}</div> : <button key={item.id} type="button" onClick={() => item.kind === 'doc' ? navigateToDocument(space.id, item.parentId, item.id) : notifyToastPreview()} aria-current={item.kind === 'doc' && item.id === activeDocId ? 'page' : undefined} className={`flex w-full items-center gap-2 rounded-lg py-1.5 pl-11 pr-3 text-left text-sm transition ${item.kind === 'doc' && item.id === activeDocId ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}><Icon size={15} />{item.name}</button>; })}</div>)}</nav></>}
    <Dialog open={createOpen} onOpenChange={setCreateOpen}><form onSubmit={submitCreate} className="space-y-4"><DialogTitle>Create {createKind === 'space' ? 'Space' : createKind}</DialogTitle><label className="block text-sm font-medium">{createKind === 'space' ? 'Space name' : `${createKind[0].toUpperCase()}${createKind.slice(1)} name`}<input autoFocus aria-label={createKind === 'space' ? 'Space name' : `${createKind} name`} value={newName} onChange={(event) => setNewName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" /></label>{parentItemId && <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">This List will be created in the selected Project.</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit">Create</Button></div></form></Dialog>
  </aside>;
}