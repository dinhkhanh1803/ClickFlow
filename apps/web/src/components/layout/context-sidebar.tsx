'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, ChevronsLeft, FileText, Folder, LayoutDashboard, ListChecks, MoreHorizontal, PanelTop, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { notifyToastPreview } from '@/lib/feedback/toast-feedback';
import { defaultLocalSpaces, loadLocalSpaces, localId, nextSpaceTone, saveLocalSpaces, type LocalSpace, type LocalSpaceItemKind } from '@/features/workspace/model/local-navigation';
import { useCreateDocumentMutation } from '@/features/workspace/data/document-queries';
import type { GlobalModulePath } from '@/components/layout/app-sidebar';
import { CreationDialog, type CreationDialogKind, type SpacePublicAccess } from '@/features/workspace/components/creation-dialog';
import { SpaceSettingsDialog } from '@/features/workspace/components/space-settings-dialog';
import { DeleteConfirmationDialog } from '@/features/workspace/components/delete-confirmation-dialog';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { TextInputDialog } from '@/components/ui/text-input-dialog';
import { useArchivedWorkspacesQuery, useArchiveProjectMutation, useArchiveWorkspaceMutation, useArchiveSectionMutation, useCreateProjectMutation, useCreateRootSectionMutation, useCreateSectionMutation, useCreateWorkspaceMutation, useDuplicateWorkspaceMutation, useRestoreWorkspaceMutation, useUpdateWorkspaceMutation, useUpdateProjectMutation, useUpdateSectionMutation, useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';

type ContextItem = { label: string; href: string };
type ContextConfig = { title: string; items: ContextItem[]; section?: string };
type CreateKind = 'space' | LocalSpaceItemKind;
type DeleteTarget = { kind: 'space' | 'folder' | 'list'; spaceId: string; itemId?: string; projectId?: string; name: string };
type RenameTarget = { kind: 'list' | 'project'; spaceId: string; itemId: string; projectId: string; name: string };

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

const DEFAULT_SPACE_ICON = '\u{1F680}';
const DEFAULT_FOLDER_LIST_NAME = 'List';
const BROKEN_EMOJI_MARKER = 'ðŸ';

function spaceAvatarText(space: { icon?: string; name: string }): string {
  if (space.icon && !space.icon.includes(BROKEN_EMOJI_MARKER)) return space.icon;
  const initial = space.name.trim().slice(0, 1).toUpperCase();
  return initial || DEFAULT_SPACE_ICON;
}

function canEditSpace(space: LocalSpace | undefined): boolean {
  return !space || space.role !== 'PUBLIC' || space.publicAccess === 'EDIT';
}

function notifyViewOnlySpace(): void {
  toast.info('This public Space is view-only.');
}

type ContextSidebarProps = { modulePath?: GlobalModulePath; preview?: boolean; onCollapse?: () => void };

export function ContextSidebar({ modulePath, preview = false, onCollapse }: ContextSidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);
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
  const [newDescription, setNewDescription] = useState('');
  const [newSpacePrivate, setNewSpacePrivate] = useState(false);
  const [newSpacePublicAccess, setNewSpacePublicAccess] = useState<SpacePublicAccess>('VIEW');
  const [newSpaceInvitees, setNewSpaceInvitees] = useState('');
  const [parentSpaceId, setParentSpaceId] = useState(defaultLocalSpaces[0].id);
  const [parentItemId, setParentItemId] = useState<string | undefined>();
  const [projectMenuId, setProjectMenuId] = useState<string | null>(null);
  const [spaceMenuId, setSpaceMenuId] = useState<string | null>(null);
  const [listMenuId, setListMenuId] = useState<string | null>(null);
  const [spaceCreateMenuId, setSpaceCreateMenuId] = useState<string | null>(null);
  const [folderCreateMenuId, setFolderCreateMenuId] = useState<string | null>(null);
  const [settingsSpaceId, setSettingsSpaceId] = useState<string | null>(null);
  const [settingsName, setSettingsName] = useState('');
  const [settingsPrivate, setSettingsPrivate] = useState(false);
  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsPublicAccess, setSettingsPublicAccess] = useState<SpacePublicAccess>('VIEW');
  const [settingsIcon, setSettingsIcon] = useState(DEFAULT_SPACE_ICON);
  const [settingsTone, setSettingsTone] = useState('bg-indigo-500');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [expandedSpaceIds, setExpandedSpaceIds] = useState<Set<string>>(() => new Set([defaultLocalSpaces[0].id]));
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set(['folder-projects']));
  const navigationQuery = useWorkspaceNavigationQuery(isSpaces);
  const archivedQuery = useArchivedWorkspacesQuery(isSpaces && archivedOpen);
  const effectiveSpaces = navigationQuery.data ?? spaces;
  const createWorkspaceMutation = useCreateWorkspaceMutation();
  const updateWorkspaceMutation = useUpdateWorkspaceMutation();
  const archiveWorkspaceMutation = useArchiveWorkspaceMutation();
  const restoreWorkspaceMutation = useRestoreWorkspaceMutation();
  const duplicateWorkspaceMutation = useDuplicateWorkspaceMutation();
  const createProjectMutation = useCreateProjectMutation();
  const updateProjectMutation = useUpdateProjectMutation();
  const archiveProjectMutation = useArchiveProjectMutation();
  const createSectionMutation = useCreateSectionMutation();
  const createRootSectionMutation = useCreateRootSectionMutation();
  const createDocumentMutation = useCreateDocumentMutation();
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
  useEffect(() => {
    const hasOpenMenu = showCreateMenu || projectMenuId !== null || spaceMenuId !== null || listMenuId !== null || spaceCreateMenuId !== null || folderCreateMenuId !== null;
    if (!hasOpenMenu) return;
    const closeMenus = () => {
      setShowCreateMenu(false);
      setProjectMenuId(null);
      setSpaceMenuId(null);
      setListMenuId(null);
      setSpaceCreateMenuId(null);
      setFolderCreateMenuId(null);
    };
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !sidebarRef.current?.contains(event.target)) closeMenus();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus();
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [folderCreateMenuId, listMenuId, projectMenuId, showCreateMenu, spaceCreateMenuId, spaceMenuId]);

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
    if (kind !== 'space') {
      const targetSpace = effectiveSpaces.find((space) => space.id === (activeSpaceId || effectiveSpaces[0]?.id || ''));
      if (!canEditSpace(targetSpace)) {
        notifyViewOnlySpace();
        setShowCreateMenu(false);
        return;
      }
    }
    setCreateKind(kind);
    setNewName('');
    setParentSpaceId(activeSpaceId || effectiveSpaces[0]?.id || '');
    setNewDescription('');
    setNewSpacePrivate(false);
    setNewSpacePublicAccess('VIEW');
    setNewSpaceInvitees('');
    setParentItemId(undefined);
    setShowCreateMenu(false);
    setCreateOpen(true);
  };
  const beginCreateInSpace = (kind: LocalSpaceItemKind, spaceId: string) => {
    const targetSpace = effectiveSpaces.find((space) => space.id === spaceId);
    if (!canEditSpace(targetSpace)) {
      notifyViewOnlySpace();
      setSpaceCreateMenuId(null);
      return;
    }
    setCreateKind(kind);
    setNewName('');
    setParentSpaceId(spaceId);
    setNewDescription('');
    setNewSpacePrivate(false);
    setNewSpacePublicAccess('VIEW');
    setNewSpaceInvitees('');
    setParentItemId(undefined);
    setSpaceCreateMenuId(null);
    setCreateOpen(true);
  };
  const beginCreateInFolder = (kind: LocalSpaceItemKind, spaceId: string, folderId: string) => {
    const targetSpace = effectiveSpaces.find((space) => space.id === spaceId);
    if (!canEditSpace(targetSpace)) {
      notifyViewOnlySpace();
      setFolderCreateMenuId(null);
      return;
    }
    setCreateKind(kind);
    setNewName('');
    setParentSpaceId(spaceId);
    setNewDescription('');
    setNewSpacePrivate(false);
    setNewSpacePublicAccess('VIEW');
    setNewSpaceInvitees('');
    setParentItemId(folderId);
    setFolderCreateMenuId(null);
    setCreateOpen(true);
  };
  const openSpaceSettings = (spaceId: string) => {
    const target = effectiveSpaces.find((space) => space.id === spaceId);
    if (!target || (target.role && target.role !== 'OWNER')) return;
    setSettingsSpaceId(spaceId);
    setSettingsName(target.name);
    setSettingsPrivate(Boolean(target.private));
    setSettingsDescription(target.description ?? '');
    setSettingsPublicAccess(target.publicAccess ?? 'VIEW');
    setSettingsIcon(target.icon && !target.icon.includes(BROKEN_EMOJI_MARKER) ? target.icon : DEFAULT_SPACE_ICON);
    setSettingsTone(target.tone);
    setSpaceMenuId(null);
  };
  const submitSpaceSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = settingsName.trim();
    if (!settingsSpaceId || !name) return;
    if (navigationQuery.usesApi) {
      try {
        await updateWorkspaceMutation.mutateAsync({ workspaceId: settingsSpaceId, input: { name, description: settingsDescription.trim() || null, private: settingsPrivate, publicAccess: settingsPublicAccess, tone: `appearance:${settingsIcon}|${settingsTone}` } });
        setSettingsSpaceId(null);
        toast.success('Space settings updated.');
      } catch { toast.error('Unable to update Space settings.'); }
      return;
    }
    const nextSpaces = spaces.map((space) => space.id === settingsSpaceId ? { ...space, name, description: settingsDescription.trim() || null, private: settingsPrivate, publicAccess: settingsPublicAccess, icon: settingsIcon, tone: settingsTone } : space);
    setSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
    setSettingsSpaceId(null);
  };
  const duplicateLocalSpace = (space: LocalSpace) => {
    const itemIds = new Map<string, string>();
    const taskIds = new Map<string, string>();
    for (const item of space.items) {
      itemIds.set(item.id, localId(item.kind));
      for (const task of item.tasks ?? []) taskIds.set(task.id, localId('task'));
    }
    const duplicated: LocalSpace = {
      ...space,
      id: localId('space'),
      name: space.name + ' copy',
      items: space.items.map((item) => ({
        ...item,
        id: itemIds.get(item.id)!,
        parentId: item.parentId ? itemIds.get(item.parentId) : undefined,
        tasks: item.tasks?.map((task) => ({ ...task, id: taskIds.get(task.id)!, createdAt: new Date().toISOString() }))
      }))
    };
    const nextSpaces = [...spaces, duplicated];
    setSpaces(nextSpaces);
    saveLocalSpaces(nextSpaces);
    navigateToSpace(duplicated.id);
    toast.success('Space duplicated.');
  };
  const runSpaceAction = (action: string, spaceId: string) => {
    const space = effectiveSpaces.find((item) => item.id === spaceId);
    if (!space) return;
    if (action === 'settings') {
      openSpaceSettings(spaceId);
    } else if (action === 'copy-link') {
      void navigator.clipboard?.writeText(`${window.location.origin}/projects?space=${spaceId}`);
    } else if (action === 'duplicate') {
      if (!canEditSpace(space)) {
        notifyViewOnlySpace();
      } else if (navigationQuery.usesApi) {
        void duplicateWorkspaceMutation.mutateAsync(spaceId).then((workspace) => {
          setExpandedSpaceIds((current) => new Set([...current, workspace.id]));
          navigateToSpace(workspace.id);
          toast.success('Space duplicated.');
        }).catch(() => toast.error('Unable to duplicate this Space.'));
      } else {
        duplicateLocalSpace(space);
      }
    } else if (action === 'delete') {
      if (!canEditSpace(space)) {
        notifyViewOnlySpace();
      } else if (space.role && space.role !== 'OWNER') {
        toast.error('Only the Space owner can delete it.');
      } else {
        setDeleteTarget({ kind: 'space', spaceId, name: space.name });
      }
    } else {
      toast.info('Workspace management is not available in the current API yet.');
    }
    setSpaceMenuId(null);
  };  const runListAction = (action: string, spaceId: string, listId: string) => {
    const space = effectiveSpaces.find((item) => item.id === spaceId);
    const list = space?.items.find((item) => item.id === listId);
    const projectId = list?.apiProjectId ?? list?.parentId ?? '';
    if (!list || (navigationQuery.usesApi && !projectId)) return;
    if (action !== 'copy-link' && !canEditSpace(space)) {
      notifyViewOnlySpace();
      setListMenuId(null);
      return;
    }
    if (action === 'rename') {
      setRenameTarget({ kind: 'list', spaceId, itemId: listId, projectId, name: list.name });
      setRenameDraft(list.name);
    } else if (action === 'settings') {
      openSpaceSettings(spaceId);
    } else if (action === 'copy-link') {
      const folderQuery = list.parentId ? `&folder=${list.parentId}` : '';
      void navigator.clipboard?.writeText(`${window.location.origin}/projects?space=${spaceId}${folderQuery}&list=${listId}`);
    } else if (action === 'duplicate') {
      void createSectionMutation.mutateAsync({ workspaceId: spaceId, projectId, input: { name: `${list.name} copy` } }).catch(() => toast.error('Unable to duplicate this List.'));
    } else if (action === 'delete') {
      setDeleteTarget({ kind: 'list', spaceId, itemId: listId, projectId, name: list.name });
    }
    setListMenuId(null);
  };
  const runProjectAction = (action: string, spaceId: string, folderId: string) => {
    const space = effectiveSpaces.find((item) => item.id === spaceId);
    const folder = space?.items.find((item) => item.id === folderId);
    if (!folder) return;
    if (action !== 'copy-link' && !canEditSpace(space)) {
      notifyViewOnlySpace();
      setProjectMenuId(null);
      return;
    }
    if (action === 'rename') {
      setRenameTarget({ kind: 'project', spaceId, itemId: folderId, projectId: folderId, name: folder.name });
      setRenameDraft(folder.name);
    } else if (action === 'settings') {
      openSpaceSettings(spaceId);
    } else if (action === 'copy-link') {
      void navigator.clipboard?.writeText(`${window.location.origin}/projects?space=${spaceId}&folder=${folderId}`);
    } else if (action === 'duplicate') {
      void createProjectMutation.mutateAsync({ workspaceId: spaceId, input: { name: `${folder.name} copy` } }).catch(() => toast.error('Unable to duplicate this Project.'));
    } else if (action === 'archive' || action === 'delete') {
      setDeleteTarget({ kind: 'folder', spaceId, itemId: folderId, projectId: folderId, name: folder.name });
    } else if (action === 'create-list') {
      beginCreateInFolder('list', spaceId, folderId);
    }
    setProjectMenuId(null);
  };
  const submitRename = async () => {
    if (!renameTarget) return;
    const nextName = renameDraft.trim();
    if (!nextName) return;
    try {
      if (renameTarget.kind === 'list') {
        await updateSectionMutation.mutateAsync({ workspaceId: renameTarget.spaceId, projectId: renameTarget.projectId, sectionId: renameTarget.itemId, name: nextName });
      } else {
        await updateProjectMutation.mutateAsync({ workspaceId: renameTarget.spaceId, projectId: renameTarget.projectId, name: nextName });
      }
      setRenameTarget(null);
      toast.success(`${renameTarget.kind === 'list' ? 'List' : 'Project'} renamed.`);
    } catch {
      toast.error(`Unable to rename this ${renameTarget.kind === 'list' ? 'List' : 'Project'}.`);
    }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { kind, spaceId, itemId, projectId } = deleteTarget;
    const targetSpace = effectiveSpaces.find((space) => space.id === spaceId);
    if (!canEditSpace(targetSpace)) {
      notifyViewOnlySpace();
      setDeleteTarget(null);
      return;
    }
    try {
      if (kind === 'space') {
        if (navigationQuery.usesApi) {
          await archiveWorkspaceMutation.mutateAsync(spaceId);
        } else {
          const nextLocalSpaces = spaces.filter((item) => item.id !== spaceId);
          setSpaces(nextLocalSpaces);
          saveLocalSpaces(nextLocalSpaces);
        }
        if (activeSpaceId === spaceId) {
          const nextSpace = effectiveSpaces.find((item) => item.id !== spaceId);
          if (nextSpace) {
            navigateToSpace(nextSpace.id);
          } else {
            const url = new URL(window.location.href);
            url.pathname = '/projects';
            url.search = '';
            window.history.pushState(null, '', url);
            setActiveSpaceId('');
            setActiveFolderId(null);
            setActiveListId(null);
            setActiveDocId(null);
            window.dispatchEvent(new Event('clickflow:space-navigation'));
          }
        }
      } else if (kind === 'folder' && itemId) {
        if (navigationQuery.usesApi) {
          await archiveProjectMutation.mutateAsync({ workspaceId: spaceId, projectId: itemId });
        } else {
          const nextLocalSpaces = spaces.map((space) => space.id === spaceId ? { ...space, items: space.items.filter((item) => item.id !== itemId && item.parentId !== itemId) } : space);
          setSpaces(nextLocalSpaces);
          saveLocalSpaces(nextLocalSpaces);
        }
        if (activeFolderId === itemId || effectiveSpaces.find((space) => space.id === spaceId)?.items.some((item) => item.parentId === itemId && (item.id === activeListId || item.id === activeDocId))) {
          navigateToSpace(spaceId);
        }
      } else if (kind === 'list' && itemId) {
        if (navigationQuery.usesApi && projectId) {
          await archiveSectionMutation.mutateAsync({ workspaceId: spaceId, projectId, sectionId: itemId });
        } else {
          const nextLocalSpaces = spaces.map((space) => space.id === spaceId ? { ...space, items: space.items.filter((item) => item.id !== itemId) } : space);
          setSpaces(nextLocalSpaces);
          saveLocalSpaces(nextLocalSpaces);
        }
        if (activeListId === itemId) {
          const parentId = effectiveSpaces.find((space) => space.id === spaceId)?.items.find((item) => item.id === itemId)?.parentId;
          navigateToSpace(spaceId, parentId);
        }
      }
      setDeleteTarget(null);
      toast.success(`${kind === 'space' ? 'Space' : kind === 'folder' ? 'Folder' : 'List'} deleted.`);
    } catch {
      toast.error(`Unable to delete this ${kind === 'space' ? 'Space' : kind === 'folder' ? 'Folder' : 'List'}.`);
    }
  };
  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (createKind !== 'space') {
      const targetSpace = effectiveSpaces.find((space) => space.id === parentSpaceId);
      if (!canEditSpace(targetSpace)) {
        notifyViewOnlySpace();
        setCreateOpen(false);
        return;
      }
    }
    if (
      createWorkspaceMutation.isPending ||
      createProjectMutation.isPending ||
      createSectionMutation.isPending ||
      createRootSectionMutation.isPending ||
      createDocumentMutation.isPending
    ) return;
    if (!navigationQuery.usesApi) {
      if (createKind === 'space') {
        const id = localId('space');
        setSpaces((current) => [...current, { id, name, description: newDescription.trim() || null, tone: nextSpaceTone(current.length), private: newSpacePrivate, publicAccess: newSpacePublicAccess, items: [] }]);
        setActiveSpaceId(id);
      } else {
        const id = localId(createKind);
        const defaultFolderList = createKind === 'folder' ? { id: localId('list'), name: DEFAULT_FOLDER_LIST_NAME, kind: 'list' as const, parentId: id } : null;
        setSpaces((current) => current.map((space) => space.id === parentSpaceId ? {
          ...space,
          items: [
            ...space.items,
            { id, name, kind: createKind, ...(parentItemId ? { parentId: parentItemId } : {}), ...(createKind === 'doc' ? { document: { content: '', updatedAt: new Date().toISOString() } } : {}) },
            ...(defaultFolderList ? [defaultFolderList] : []),
          ],
        } : space));
        setActiveSpaceId(parentSpaceId);
        if (createKind === 'folder') setExpandedFolderIds((current) => new Set([...current, id]));
        if (createKind === 'doc') navigateToDocument(parentSpaceId, parentItemId, id);
      }
      setCreateOpen(false);
      return;
    }
    if (createKind === 'space') {
      try {
        const workspace = await createWorkspaceMutation.mutateAsync({ name, description: newDescription.trim() || null, private: newSpacePrivate, publicAccess: newSpacePublicAccess });
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
      try {
        const project = await createProjectMutation.mutateAsync({ workspaceId: parentSpaceId, input: { name, description: newDescription.trim() || null } });
        await createSectionMutation.mutateAsync({ workspaceId: parentSpaceId, projectId: project.id, input: { name: DEFAULT_FOLDER_LIST_NAME } });
        await navigationQuery.refetch();
        setActiveSpaceId(parentSpaceId);
        setExpandedSpaceIds((current) => new Set([...current, parentSpaceId]));
        setExpandedFolderIds((current) => new Set([...current, project.id]));
      } catch {
        toast.error('Unable to create this Project.');
        return;
      }
    } else if (createKind === 'list' && parentItemId) {
      void createSectionMutation.mutateAsync({ workspaceId: parentSpaceId, projectId: parentItemId, input: { name } }).catch(() => toast.error('Unable to create this List.'));
      setActiveSpaceId(parentSpaceId);
    } else if (createKind === 'list') {
      try {
        await createRootSectionMutation.mutateAsync({ workspaceId: parentSpaceId, name });
        setActiveSpaceId(parentSpaceId);
      } catch {
        toast.error('Unable to create this List.');
        return;
      }
    } else if (createKind === 'doc') {
      try {
        const document = await createDocumentMutation.mutateAsync({ workspaceId: parentSpaceId, input: { title: name, projectId: parentItemId ?? null, content: '' } });
        navigateToDocument(parentSpaceId, parentItemId, document.id);
        toast.success('Document created.');
      } catch {
        toast.error('Unable to create this Document.');
        return;
      }
    }
    setCreateOpen(false);
  };

  const normalizedSpacesSearch = spacesSearchQuery.trim().toLocaleLowerCase();
  const hasSpacesSearch = isSpaces && normalizedSpacesSearch.length > 0;
  const matchesSpacesSearch = (name: string) => name.toLocaleLowerCase().includes(normalizedSpacesSearch);
  const creationSpace = effectiveSpaces.find((space) => space.id === parentSpaceId);
  const creationParent = parentItemId ? creationSpace?.items.find((item) => item.id === parentItemId)?.name : createKind === 'space' ? undefined : creationSpace?.name;
  const creationPending = createWorkspaceMutation.isPending || createProjectMutation.isPending || createSectionMutation.isPending || createRootSectionMutation.isPending || createDocumentMutation.isPending;
  const deletePending = archiveWorkspaceMutation.isPending || archiveProjectMutation.isPending || archiveSectionMutation.isPending;
  const restorePending = restoreWorkspaceMutation.isPending;
  const deleteKindLabel = deleteTarget?.kind === 'space' ? 'Space' : deleteTarget?.kind === 'folder' ? 'Folder' : 'List';
  const deleteDescription = deleteTarget?.kind === 'space'
    ? 'The Space and all of its content will be archived and removed from active views.'
    : deleteTarget?.kind === 'folder'
      ? 'The Folder and the Lists, Docs, and tasks inside it will be archived.'
      : 'The List and its tasks will be archived and removed from active views.';
  return <aside ref={sidebarRef} onClick={(event) => { if (!(event.target as HTMLElement).closest('[data-options-menu], [data-options-trigger]')) { setProjectMenuId(null); setSpaceMenuId(null); setListMenuId(null); setSpaceCreateMenuId(null); setFolderCreateMenuId(null); } }} aria-label={`${context.title} ${preview ? 'preview' : 'navigation'}`} className={`glass-shell hidden h-screen w-72 shrink-0 flex-col border-r border-white/30 p-3 md:flex ${preview ? 'absolute left-0 top-0 z-20 rounded-r-2xl border border-white/45 shadow-2xl shadow-slate-950/20' : ''}`}>
    <div className="relative flex items-center justify-between gap-2"><h2 className="text-base font-semibold">{context.title}</h2><div className="flex items-center gap-1"><Button aria-label={`Search ${context.title}`} variant="ghost" size="sm" onClick={() => { if (!isSpaces) return; setSpacesSearchOpen((open) => !open); setSpacesSearchQuery(''); }}><Search size={17} /></Button><Button aria-label="Collapse panel" variant="ghost" size="sm" onClick={onCollapse}><ChevronsLeft size={17} /></Button><Button aria-label={`Create ${isSpaces ? 'space' : 'new item'}`} size="sm" onClick={() => isSpaces ? setShowCreateMenu((open) => !open) : notifyToastPreview}><Plus size={17} /></Button></div>{isSpaces && showCreateMenu && <div role="menu" data-options-menu className="absolute right-0 top-10 z-30 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><p className="px-2 py-1 text-xs font-semibold text-slate-500">Create</p>{creationOptions.map(({ kind, label, description, icon: Icon }) => <button type="button" role="menuitem" key={kind} onClick={() => beginCreate(kind)} className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"><Icon size={17} className="mt-0.5 shrink-0 text-slate-500" /><span><span className="block text-sm font-medium">{label}</span><span className="block text-xs text-slate-500">{description}</span></span></button>)}</div>}</div>
    {isSpaces && spacesSearchOpen && <label className="relative mt-3 block"><Search aria-hidden="true" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus aria-label="Search Spaces tree" value={spacesSearchQuery} onChange={(event) => setSpacesSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { setSpacesSearchQuery(''); setSpacesSearchOpen(false); } }} placeholder="Search Spaces" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" /></label>}    <nav className="mt-5 space-y-1">{context.items.map((item) => <Link key={item.label} href={item.href} aria-current={item.href === pathname ? 'page' : undefined} className={`block rounded-lg px-3 py-2 text-sm transition ${item.href === pathname ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-600 hover:bg-white/55 dark:text-slate-300 dark:hover:bg-slate-800/70'}`}>{item.label}</Link>)}</nav>
    {isSpaces && <><div className="my-4 border-t border-white/40 dark:border-slate-700/60" /><div className="flex items-center justify-between px-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{context.section}</p><div className="flex items-center gap-1"><button type="button" onClick={() => setArchivedOpen(true)} className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800">Archived</button><button type="button" aria-label="Create a new Space" onClick={() => beginCreate('space')} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><Plus size={15} /></button></div></div><nav className="mt-2 space-y-1">{navigationQuery.isLoading && <p role="status" className="px-3 py-2 text-xs text-slate-500">Loading workspaces...</p>}{navigationQuery.isError && <p role="alert" className="px-3 py-2 text-xs text-rose-600">Unable to load workspaces.</p>}{!navigationQuery.isLoading && !navigationQuery.isError && effectiveSpaces.length === 0 && <p className="px-3 py-2 text-xs text-slate-500">No workspaces available.</p>}{effectiveSpaces.filter((space) => !hasSpacesSearch || matchesSpacesSearch(space.name) || space.items.some((item) => matchesSpacesSearch(item.name))).map((space) => <div key={space.id}><div className="relative flex items-center">{space.items.length > 0 && <button type="button" aria-label={`${expandedSpaceIds.has(space.id) ? 'Collapse' : 'Expand'} ${space.name}`} onClick={() => toggleTree(space.id, setExpandedSpaceIds)} className="ml-1 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">{(expandedSpaceIds.has(space.id) || hasSpacesSearch) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>}<Link href={`/projects?space=${space.id}`} onClick={(event) => { event.preventDefault(); navigateToSpace(space.id); }} aria-label={space.name} aria-current={space.id === activeSpaceId && !activeFolderId && !activeListId && !activeDocId ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${space.id === activeSpaceId && !activeFolderId && !activeListId && !activeDocId ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-600 hover:bg-white/55 dark:text-slate-300 dark:hover:bg-slate-800/70'}`}><span className={`grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-md text-[11px] font-semibold leading-none text-white ${space.tone}`}>{spaceAvatarText(space)}</span><span className="min-w-0 flex-1 truncate">{space.name}</span>{space.private ? <span className="shrink-0 text-xs font-normal text-slate-400">Private</span> : <span className="shrink-0 text-xs font-normal text-indigo-500">{space.publicAccess === 'EDIT' ? 'Edit' : 'Public'}</span>}</Link><button type="button" data-options-trigger aria-label={`Create in ${space.name}`} onClick={() => { setSpaceCreateMenuId((current) => current === space.id ? null : space.id); setSpaceMenuId(null); setProjectMenuId(null); setListMenuId(null); }} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><Plus size={15} /></button>{spaceCreateMenuId === space.id && <div role="menu" data-options-menu className="absolute right-2 top-8 z-40 w-48 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><p className="px-3 py-1 text-xs font-semibold text-slate-500">Create in Space</p><button type="button" role="menuitem" onClick={() => beginCreateInSpace('folder', space.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Folder size={15} />Folder</button><button type="button" role="menuitem" onClick={() => beginCreateInSpace('list', space.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><ListChecks size={15} />List</button><button type="button" role="menuitem" onClick={() => beginCreateInSpace('doc', space.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><FileText size={15} />Doc</button></div>}<button type="button" data-options-trigger aria-label={`More options for ${space.name}`} onClick={() => { setSpaceMenuId((current) => current === space.id ? null : space.id); setProjectMenuId(null); setListMenuId(null); setSpaceCreateMenuId(null); }} className="mr-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button>{spaceMenuId === space.id && <div role="menu" data-options-menu className="absolute left-8 top-8 z-40 w-48 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900">{(!space.role || space.role === 'OWNER') && <button type="button" role="menuitem" onClick={() => runSpaceAction('settings', space.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Space settings</button>}<button type="button" role="menuitem" onClick={() => runSpaceAction('copy-link', space.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => runSpaceAction('duplicate', space.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" />{(!space.role || space.role === 'OWNER') && <button type="button" role="menuitem" onClick={() => runSpaceAction('delete', space.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button>}</div>}</div>{(expandedSpaceIds.has(space.id) || hasSpacesSearch) && space.items.filter((item) => !item.parentId && (!hasSpacesSearch || matchesSpacesSearch(item.name) || space.items.some((child) => child.parentId === item.id && matchesSpacesSearch(child.name)))).map((item) => { const Icon = itemIcon(item.kind); const childLists = space.items.filter((child) => child.parentId === item.id); return item.kind === 'folder' ? <div key={item.id}><div className="relative flex items-center gap-1">{childLists.length > 0 ? <button type="button" aria-label={`${expandedFolderIds.has(item.id) ? 'Collapse' : 'Expand'} ${item.name}`} onClick={() => toggleTree(item.id, setExpandedFolderIds)} className="ml-7 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">{(expandedFolderIds.has(item.id) || hasSpacesSearch) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button> : <span className="ml-7 w-[18px]" />}<button type="button" onClick={() => { navigateToSpace(space.id, item.id); setExpandedFolderIds((current) => new Set([...current, item.id])); }} aria-current={item.id === activeFolderId ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-1 pr-1 text-left text-sm transition ${item.id === activeFolderId ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}><Icon size={15} />{item.name}</button><div className="mr-2 flex items-center"><button type="button" data-options-trigger aria-label={`Create in ${item.name}`} onClick={() => { setFolderCreateMenuId((current) => current === item.id ? null : item.id); setProjectMenuId(null); setListMenuId(null); setSpaceMenuId(null); setSpaceCreateMenuId(null); }} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><Plus size={15} /></button>{folderCreateMenuId === item.id && <div role="menu" data-options-menu className="absolute right-8 top-8 z-40 w-48 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><p className="px-3 py-1 text-xs font-semibold text-slate-500">Create in Folder</p><button type="button" role="menuitem" onClick={() => beginCreateInFolder('list', space.id, item.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><ListChecks size={15} />List</button><button type="button" role="menuitem" onClick={() => beginCreateInFolder('doc', space.id, item.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><FileText size={15} />Doc</button></div>}<button type="button" data-options-trigger aria-label={`More options for ${item.name}`} onClick={() => { setProjectMenuId((current) => current === item.id ? null : item.id); setSpaceMenuId(null); setListMenuId(null); setSpaceCreateMenuId(null); }} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button></div>{projectMenuId === item.id && <div role="menu" data-options-menu className="absolute left-10 top-8 z-40 w-56 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={() => runProjectAction('rename', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Rename</button><button type="button" role="menuitem" onClick={() => runProjectAction('copy-link', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => runProjectAction('duplicate', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><button type="button" role="menuitem" onClick={() => runProjectAction('delete', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button></div>}</div>{(expandedFolderIds.has(item.id) || hasSpacesSearch) && childLists.filter((child) => !hasSpacesSearch || matchesSpacesSearch(child.name)).map((child) => { const ChildIcon = itemIcon(child.kind); return <div key={child.id} className="relative flex items-center"><button type="button" onClick={() => child.kind === 'doc' ? navigateToDocument(space.id, item.id, child.id) : navigateToSpace(space.id, item.id, child.id)} aria-current={child.kind === 'doc' ? child.id === activeDocId ? 'page' : undefined : child.id === activeListId ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-[3.8rem] pr-1 text-left text-sm transition ${(child.kind === 'doc' ? child.id === activeDocId : child.id === activeListId) ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}><ChildIcon size={14} />{child.name}</button><button type="button" data-options-trigger aria-label={`More options for ${child.name}`} onClick={() => { setListMenuId((current) => current === child.id ? null : child.id); setProjectMenuId(null); setSpaceMenuId(null); setSpaceCreateMenuId(null); }} className="mr-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button>{listMenuId === child.id && <div role="menu" data-options-menu className="absolute left-12 top-8 z-40 w-44 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={() => runListAction('rename', space.id, child.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Rename</button><button type="button" role="menuitem" onClick={() => runListAction('copy-link', space.id, child.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => runListAction('duplicate', space.id, child.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><button type="button" role="menuitem" onClick={() => runListAction('delete', space.id, child.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button></div>}</div>; })}</div> : item.kind === 'list' ? <div key={item.id} className="relative flex items-center"><button type="button" onClick={() => navigateToSpace(space.id, undefined, item.id)} aria-current={item.id === activeListId ? 'page' : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-11 pr-1 text-left text-sm transition ${item.id === activeListId ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}><Icon size={15} />{item.name}</button><button type="button" data-options-trigger aria-label={`More options for ${item.name}`} onClick={() => { setListMenuId((current) => current === item.id ? null : item.id); setProjectMenuId(null); setSpaceMenuId(null); setSpaceCreateMenuId(null); }} className="mr-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"><MoreHorizontal size={15} /></button>{listMenuId === item.id && <div role="menu" data-options-menu className="absolute left-12 top-8 z-40 w-44 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><button type="button" role="menuitem" onClick={() => runListAction('rename', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Rename</button><button type="button" role="menuitem" onClick={() => runListAction('copy-link', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Copy link</button><button type="button" role="menuitem" onClick={() => runListAction('duplicate', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Duplicate</button><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><button type="button" role="menuitem" onClick={() => runListAction('delete', space.id, item.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">Delete</button></div>}</div> : <button key={item.id} type="button" onClick={() => item.kind === 'doc' ? navigateToDocument(space.id, item.parentId, item.id) : notifyToastPreview()} aria-current={item.kind === 'doc' && item.id === activeDocId ? 'page' : undefined} className={`flex w-full items-center gap-2 rounded-lg py-1.5 pl-11 pr-3 text-left text-sm transition ${item.kind === 'doc' && item.id === activeDocId ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'}`}><Icon size={15} />{item.name}</button>; })}</div>)}</nav></>}
<TextInputDialog open={renameTarget !== null} title={renameTarget?.kind === 'list' ? 'Rename List' : 'Rename Project'} label={renameTarget?.kind === 'list' ? 'List name' : 'Project name'} value={renameDraft} onValueChange={setRenameDraft} onOpenChange={(open) => { if (!open) setRenameTarget(null); }} onSubmit={submitRename} pending={updateProjectMutation.isPending || updateSectionMutation.isPending} />
<Dialog open={archivedOpen} onOpenChange={setArchivedOpen} ariaLabel="Archived Spaces" contentClassName="max-w-lg">
  <div className="space-y-4"><DialogTitle>Archived Spaces</DialogTitle>{archivedQuery.isLoading ? <p role="status" className="text-sm text-slate-500">Loading archived Spaces...</p> : archivedQuery.isError ? <p role="alert" className="text-sm text-rose-600">Unable to load archived Spaces.</p> : archivedQuery.data?.length ? <div className="space-y-2">{archivedQuery.data.map((space) => <div key={space.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"><div className="min-w-0"><p className="truncate text-sm font-semibold">{space.name}</p><p className="text-xs text-slate-500">Archived {space.archivedAt ? new Date(space.archivedAt).toLocaleDateString() : ''}</p></div><Button size="sm" disabled={restorePending} onClick={() => void restoreWorkspaceMutation.mutateAsync(space.id).then((restored) => { setArchivedOpen(false); navigateToSpace(restored.id); toast.success('Space restored.'); }).catch(() => toast.error('Unable to restore this Space.'))}>Restore</Button></div>)}</div> : <p role="status" className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">No archived Spaces.</p>}</div>
</Dialog>
<DeleteConfirmationDialog open={deleteTarget !== null} title={`Delete ${deleteKindLabel}?`} itemName={deleteTarget?.name ?? ''} description={deleteDescription} pending={deletePending} confirmLabel={`Delete ${deleteKindLabel}`} onOpenChange={(open) => { if (!open && !deletePending) setDeleteTarget(null); }} onConfirm={confirmDelete} />
<SpaceSettingsDialog open={settingsSpaceId !== null} name={settingsName} description={settingsDescription} isPrivate={settingsPrivate} publicAccess={settingsPublicAccess} icon={settingsIcon} tone={settingsTone} pending={updateWorkspaceMutation.isPending} onOpenChange={(open) => { if (!open) setSettingsSpaceId(null); }} onNameChange={setSettingsName} onDescriptionChange={setSettingsDescription} onPrivateChange={setSettingsPrivate} onPublicAccessChange={setSettingsPublicAccess} onIconChange={setSettingsIcon} onToneChange={setSettingsTone} onSubmit={submitSpaceSettings} />
    <CreationDialog kind={createKind as CreationDialogKind} open={createOpen} name={newName} description={newDescription} isPrivate={newSpacePrivate} publicAccess={newSpacePublicAccess} invitees={newSpaceInvitees} pending={creationPending} parentLabel={creationParent} onNameChange={setNewName} onDescriptionChange={setNewDescription} onPrivateChange={setNewSpacePrivate} onPublicAccessChange={setNewSpacePublicAccess} onInviteesChange={setNewSpaceInvitees} onOpenChange={setCreateOpen} onSubmit={submitCreate} />
  </aside>;
}




