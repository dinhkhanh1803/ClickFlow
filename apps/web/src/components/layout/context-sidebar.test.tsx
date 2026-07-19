import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LOCAL_SPACES_STORAGE_KEY } from '@/features/workspace/model/local-navigation';
vi.mock('next/navigation', () => ({ usePathname: () => '/calendar' }));
import { ContextSidebar } from '@/components/layout/context-sidebar';

describe('ContextSidebar', () => {
  afterEach(() => { cleanup(); window.localStorage.clear(); });

  it('renders Planner-specific navigation for the active global module', () => {
    render(<ContextSidebar />);
    expect(screen.getByRole('heading', { name: 'Planner' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Schedule' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Focus' })).toBeInTheDocument();
  });

  it('filters the Spaces tree from the header search and removes the unused options button', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-product', name: 'Product Space', tone: 'bg-indigo-500', items: [
        { id: 'folder-launch', name: 'Launch', kind: 'folder' },
        { id: 'list-release', name: 'Release checklist', kind: 'list', parentId: 'folder-launch' },
        { id: 'folder-archive', name: 'Archive', kind: 'folder' },
        { id: 'list-legacy', name: 'Legacy work', kind: 'list', parentId: 'folder-archive' },
      ] },
    ]));
    render(<ContextSidebar modulePath="/projects" />);

    expect(screen.queryByLabelText('Spaces options')).not.toBeInTheDocument();
    await user.click(await screen.findByLabelText('Search Spaces'));
    await user.type(screen.getByLabelText('Search Spaces tree'), 'release');

    expect(screen.getByRole('link', { name: 'Product Space' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Launch' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Release checklist' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
  });
  it('creates a Space locally from the Spaces menu', async () => {
    const user = userEvent.setup();
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(screen.getByLabelText('Create space'));
    await user.click(screen.getByRole('menuitem', { name: 'SpaceOrganize your team work' }));
    await user.type(screen.getByLabelText('Space name'), 'Marketing');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByRole('link', { name: /Marketing\s*Private/ })).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('Marketing');
  });

  it('keeps the global Create menu focused on local workspace items', async () => {
    const user = userEvent.setup();
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(screen.getByLabelText('Create space'));

    expect(screen.getByRole('menuitem', { name: 'SpaceOrganize your team work' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'FolderGroup Lists, Docs and more' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'ListTrack tasks and projects' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'DocCreate shared documentation' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Dashboard/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Whiteboard/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Form/ })).not.toBeInTheDocument();
  });

  it('closes sidebar menus when clicking outside the sidebar', async () => {
    const user = userEvent.setup();
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(screen.getByLabelText('Create space'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes item option menus with Escape', async () => {
    const user = userEvent.setup();
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(screen.getByRole('button', { name: 'More options for Projects' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
  it('creates a List inside a Project folder from its plus button', async () => {
    const user = userEvent.setup();
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(screen.getByRole('button', { name: 'Create in Projects' }));
    await user.click(screen.getByRole('menuitem', { name: 'List' }));
    await user.type(screen.getByLabelText('list name'), 'Sprint planning');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByRole('button', { name: 'Sprint planning' })).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('folder-projects');
  });

  it('highlights the selected Folder instead of its parent Space', async () => {
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects');
    render(<ContextSidebar modulePath="/projects" />);

    const space = screen.getByRole('link', { name: 'Space 1' });
    const folder = screen.getByRole('button', { name: 'Projects' });

    expect(space).not.toHaveAttribute('aria-current', 'page');
    expect(folder).toHaveAttribute('aria-current', 'page');
  });
  it('highlights a selected List without also highlighting its parent Folder', () => {
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([{ id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [{ id: 'folder-projects', name: 'Projects', kind: 'folder' }, { id: 'list-abc', name: 'ABC', kind: 'list', parentId: 'folder-projects' }] }]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-abc');
    render(<ContextSidebar modulePath="/projects" />);

    expect(screen.getByRole('button', { name: 'Projects' })).not.toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'ABC' })).toHaveAttribute('aria-current', 'page');
  });
  it('leaves a Doc route when selecting a Folder', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([{ id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [{ id: 'folder-projects', name: 'Projects', kind: 'folder' }, { id: 'list-abc', name: 'ABC', kind: 'list', parentId: 'folder-projects' }, { id: 'doc-notes', name: 'Project Notes', kind: 'doc', parentId: 'folder-projects' }] }]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&doc=doc-notes');
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(await screen.findByRole('button', { name: 'Projects' }));

    expect(new URLSearchParams(window.location.search).get('doc')).toBeNull();
  });
  it('leaves a Doc route when selecting a List', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([{ id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [{ id: 'folder-projects', name: 'Projects', kind: 'folder' }, { id: 'list-abc', name: 'ABC', kind: 'list', parentId: 'folder-projects' }, { id: 'doc-notes', name: 'Project Notes', kind: 'doc', parentId: 'folder-projects' }] }]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&doc=doc-notes');
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(await screen.findByRole('button', { name: 'ABC' }));

    const parameters = new URLSearchParams(window.location.search);
    expect(parameters.get('doc')).toBeNull();
    expect(parameters.get('list')).toBe('list-abc');
  });
  it('opens a Doc from the Space navigation tree', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([{ id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [{ id: 'folder-projects', name: 'Projects', kind: 'folder' }, { id: 'doc-notes', name: 'Project Notes', kind: 'doc', parentId: 'folder-projects' }] }]));
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(await screen.findByRole('button', { name: 'Project Notes' }));

    expect(new URLSearchParams(window.location.search).get('doc')).toBe('doc-notes');
  });
  it('shows project actions from the more menu', async () => {
    const user = userEvent.setup();
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(screen.getByRole('button', { name: 'More options for Projects' }));

    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });
  it('keeps folder options focused on actions that work locally', async () => {
    const user = userEvent.setup();
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(screen.getByRole('button', { name: 'More options for Projects' }));

    expect(screen.getByRole('menu')).toHaveTextContent('Rename');
    expect(screen.getByRole('menu')).toHaveTextContent('Copy link');
    expect(screen.getByRole('menu')).toHaveTextContent('Duplicate');
    expect(screen.getByRole('menu')).toHaveTextContent('Delete');
    expect(screen.queryByRole('menuitem', { name: 'Automations' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Custom Fields' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Task statuses' })).not.toBeInTheDocument();
  });  it('synchronizes a folder created from the overview without reloading', async () => {
    render(<ContextSidebar modulePath="/projects" />);
    await screen.findByRole('link', { name: 'Space 1' });

    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'folder-roadmap', name: 'Roadmap', kind: 'folder' },
      ] },
    ]));
    window.dispatchEvent(new Event('clickflow:local-spaces-changed'));

    expect(await screen.findByRole('button', { name: 'Roadmap' })).toBeInTheDocument();
  });
  it('keeps a long project options menu inside the viewport', async () => {
    const user = userEvent.setup();
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(screen.getByRole('button', { name: 'More options for Projects' }));

    expect(screen.getByRole('menu')).toHaveClass('max-h-[calc(100vh-2rem)]', 'overflow-y-auto');
  });
  it('creates a Doc page from a Space plus menu', async () => {
    const user = userEvent.setup();
    render(<ContextSidebar modulePath="/projects" />);

    await user.click(screen.getByRole('button', { name: 'Create in Space 1' }));
    await user.click(screen.getByRole('menuitem', { name: 'Doc' }));
    await user.type(screen.getByLabelText('doc name'), 'Project notes');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByRole('button', { name: 'Project notes' })).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('Project notes');
  });
});