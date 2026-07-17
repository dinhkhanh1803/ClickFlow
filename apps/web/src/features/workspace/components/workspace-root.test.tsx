import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceRoot } from '@/features/workspace/components/workspace-root';
import { LOCAL_SPACES_STORAGE_KEY } from '@/features/workspace/model/local-navigation';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/projects');
});

describe('WorkspaceRoot', () => {
  it('creates a Folder from the Space overview', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot />);

    await user.click(screen.getByRole('button', { name: 'New folder' }));
    await user.type(screen.getByLabelText('Folder name'), 'Marketing');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByRole('button', { name: /Marketing0 lists/ })).toBeInTheDocument();
  });
  it('edits a project from its workspace header', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot initialProjectId="project-product-launch" />);

    await user.click(screen.getByRole('button', { name: 'Project settings' }));
    const name = screen.getByLabelText('Project name');
    await user.clear(name);
    await user.type(name, 'Launch system');
    await user.click(screen.getByRole('button', { name: 'Save project' }));

    expect(screen.getByRole('heading', { name: 'Launch system' })).toBeInTheDocument();
  });
  it('keeps task status in sync with the board', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot initialProjectId="project-product-launch" />);

    await user.click(screen.getByRole('button', { name: 'Define information architecture' }));
    await user.selectOptions(screen.getByLabelText('Status'), 'Done');

    expect(screen.getByLabelText('Done tasks')).toHaveTextContent('Define information architecture');
  });

  it('records checklist work and a comment in the task inspector', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot initialProjectId="project-product-launch" />);

    await user.click(screen.getByRole('button', { name: 'Define information architecture' }));
    await user.click(screen.getByRole('checkbox', { name: 'Map navigation hierarchy' }));
    await user.type(screen.getByLabelText('Comment'), 'Navigation structure approved.');
    await user.click(screen.getByRole('button', { name: 'Post comment' }));

    expect(screen.getByRole('checkbox', { name: 'Map navigation hierarchy' })).toBeChecked();
    expect(screen.getByText('Navigation structure approved.')).toBeInTheDocument();
  });
  it('keeps the compact workspace overview frame while using live projects', () => {
    render(<WorkspaceRoot />);

    expect(screen.getByRole('heading', { name: 'Recent' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Docs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bookmarks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Folders' })).toBeInTheDocument();
  });
  it('opens task detail from Recent without leaving the Space overview', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot />);

    await user.click(screen.getByRole('button', { name: 'Define information architecture' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Task title')).toHaveValue('Define information architecture');
  });
  it('switches the Space tab content without leaving the Space frame', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot />);

    await user.click(screen.getByRole('tab', { name: 'Board' }));

    expect(screen.getByRole('tab', { name: 'Board' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Space Board' })).toBeInTheDocument();
    expect(screen.getByText('Space 1')).toBeInTheDocument();
  });
  it('renders the Space Board with ClickUp-style status controls and compact columns', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot />);

    await user.click(screen.getByRole('tab', { name: 'Board' }));

    expect(screen.getByRole('button', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByText('TO DO')).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add group' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Add task in/ })).toHaveLength(3);
  });
  it('groups the Space List by project and status', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot />);

    await user.click(screen.getByRole('tab', { name: 'List' }));

    expect(screen.getByRole('heading', { name: 'Space List' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Product launch' })).toBeInTheDocument();
    expect(screen.getByText('Assignee')).toBeInTheDocument();
    expect(screen.getByText('Due date')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Define information architecture' })).toBeInTheDocument();
  });
  it('opens a task detail modal from the Space List without navigating to the project workspace', async () => {
    const user = userEvent.setup();
    render(<WorkspaceRoot />);

    await user.click(screen.getByRole('tab', { name: 'List' }));
    await user.click(screen.getByRole('button', { name: 'Define information architecture' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Task title')).toHaveValue('Define information architecture');
    await user.click(screen.getByRole('button', { name: 'Enter full screen' }));
    expect(screen.getByRole('button', { name: 'Exit full screen' })).toBeInTheDocument();
    expect(screen.queryByText('Project workspace')).not.toBeInTheDocument();
  });
  it('shows a ClickUp-style icon on every Space view tab in the expected order', () => {
    render(<WorkspaceRoot />);

    const expectedViews = ['Overview', 'Board', 'List', 'Calendar', 'Table', 'Gantt'];
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(expectedViews);

    expectedViews.forEach((view) => {
      expect(screen.getByRole('tab', { name: view }).querySelector('svg')).toBeInTheDocument();
    });
  });
  it('does not show Add Channel in the Space tab bar', () => {
    render(<WorkspaceRoot />);

    expect(screen.queryByRole('button', { name: 'Add Channel' })).not.toBeInTheDocument();
  });
  it('filters overview Docs and Lists to the selected Folder', async () => {
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-sprint', name: 'Sprint', kind: 'list', parentId: 'folder-projects' },
        { id: 'doc-folder', name: 'Folder notes', kind: 'doc', parentId: 'folder-projects' },
        { id: 'doc-space', name: 'Space notes', kind: 'doc' },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects');

    render(<WorkspaceRoot />);

    expect(await screen.findByRole('heading', { name: 'Lists' })).toBeInTheDocument();
    expect(screen.getByText('Sprint')).toBeInTheDocument();
    expect(screen.getByText('Folder notes')).toBeInTheDocument();
    expect(screen.getByText('Define information architecture')).toBeInTheDocument();
    expect(screen.queryByText('Outline activation interview')).not.toBeInTheDocument();
    expect(screen.queryByText('Space notes')).not.toBeInTheDocument();
  });  it('creates a List inside the selected Folder', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [{ id: 'folder-projects', name: 'Projects', kind: 'folder' }] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'New list' }));
    await user.type(screen.getByLabelText('List name'), 'Roadmap');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByRole('button', { name: 'Roadmap' })).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('folder-projects');
  });  it('opens a selected List without an Overview tab', async () => {
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects' },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');

    render(<WorkspaceRoot />);

    expect(await screen.findByRole('tab', { name: 'List' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('tab', { name: 'Overview' })).not.toBeInTheDocument();
  });  it('keeps Board and List empty for a selected List without tasks', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects' },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('tab', { name: 'Board' }));
    expect(screen.queryByText('Define information architecture')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add task in TO DO' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'List' }));
    expect(screen.getByText('New status')).toBeInTheDocument();
  });  it('creates a task locally in the selected List', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects' },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Add Task' }));
    await user.type(screen.getByLabelText('Task name'), 'Prepare kickoff');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(screen.getByText('Prepare kickoff')).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('Prepare kickoff');
  });
  it('collapses and expands a status group in the local List', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Collapse TO DO' }));
    expect(screen.queryByRole('button', { name: 'Prepare kickoff' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand TO DO' }));
    expect(screen.getByRole('button', { name: 'Prepare kickoff' })).toBeInTheDocument();
  });
  it('selects local tasks and deletes them from the bulk action bar', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('checkbox', { name: 'Select task Prepare kickoff' }));
    expect(screen.getByRole('toolbar', { name: 'Bulk task actions' })).toHaveTextContent('1 task selected');
    await user.click(screen.getByRole('button', { name: 'Delete selected tasks' }));

    expect(screen.queryByRole('button', { name: 'Prepare kickoff' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).not.toContain('Prepare kickoff');
  });  it('creates a task in only the final status selected in the dialog', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', statusGroups: [{ id: 'status-done', name: 'Done', taskStatus: 'Done', color: 'indigo', scope: 'list' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('tab', { name: 'Board' }));
    await user.click(screen.getByRole('button', { name: 'Add task in DONE' }));
    await user.type(screen.getByLabelText('Task name'), 'Ship release');
    await user.selectOptions(screen.getByLabelText('Task status'), screen.getByRole('option', { name: 'COMPLETE' }));
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(screen.getAllByRole('button', { name: 'Ship release' })).toHaveLength(1);
  });  it('opens task detail after creating a local task', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects' },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Add Task' }));
    await user.type(screen.getByLabelText('Task name'), 'Prepare kickoff');
    await user.click(screen.getByRole('button', { name: 'Create task' }));
    await user.click(screen.getByRole('button', { name: 'Prepare kickoff' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Task title')).toHaveValue('Prepare kickoff');
  });
  it('opens a searchable grouped status menu for a local task', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', dueDate: '', description: '', comments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Prepare kickoff' }));
    await user.click(screen.getByRole('button', { name: 'TO DO' }));

    expect(screen.getByPlaceholderText('Search statuses')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'IN PROGRESS' }));
    expect(screen.getByRole('button', { name: 'IN PROGRESS' })).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('In progress');
  });
  it('persists extended local task metadata from the task detail', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', dueDate: '', description: '', comments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Prepare kickoff' }));
    expect(screen.getByText('Time estimate')).toBeInTheDocument();
    expect(screen.getByText('Track time')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit time estimate' }));
    await user.type(screen.getByLabelText('Estimate hours'), '2');
    await user.click(screen.getByRole('button', { name: 'Save estimate' }));
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('timeEstimate');
  });
  it('edits priority, estimate, and tags with local task pickers', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Prepare kickoff' }));
    await user.click(screen.getByRole('button', { name: 'Normal' }));
    await user.click(screen.getByRole('option', { name: 'High' }));
    expect(screen.getByRole('button', { name: 'High' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit time estimate' }));
    await user.clear(screen.getByLabelText('Estimate hours'));
    await user.type(screen.getByLabelText('Estimate hours'), '1.5');
    await user.click(screen.getByRole('button', { name: 'Save estimate' }));
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('1h 30m');

    await user.click(screen.getByRole('button', { name: 'Edit tags' }));
    await user.type(screen.getByLabelText('Tag name'), 'UI');
    await user.click(screen.getByRole('button', { name: 'Create tag UI' }));
    expect(screen.getByRole('option', { name: 'UI' })).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('tags');
  });
  it('sets local assignee and due date with task pickers', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Prepare kickoff' }));
    await user.click(screen.getByRole('button', { name: 'Edit assignee' }));
    await user.click(screen.getByRole('option', { name: /Me/ }));
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('"assignee":"Me"');

    await user.click(screen.getByRole('button', { name: 'Edit dates' }));
    await user.click(screen.getByRole('button', { name: /Tomorrow/ }));
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('"dueDate"');
  });
  it('keeps only one task-detail picker open at a time', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Prepare kickoff' }));
    await user.click(screen.getByRole('button', { name: 'TO DO' }));
    expect(screen.getByPlaceholderText('Search statuses')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Normal' }));
    expect(screen.queryByPlaceholderText('Search statuses')).not.toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Task priority choices' })).toBeInTheDocument();
  });
  it('stores task attachments locally and exposes an icon-only comment submit action', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Prepare kickoff' }));
    await user.upload(screen.getByLabelText('Add attachment'), new File(['brief'], 'kickoff.txt', { type: 'text/plain' }));

    expect(await screen.findByText('kickoff.txt')).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('kickoff.txt');
    expect(screen.getByRole('button', { name: 'Send comment' })).toBeInTheDocument();
  });
  it('opens an image attachment in an expanded preview dialog', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [{ id: 'attachment-1', name: 'mockup.png', mimeType: 'image/png', size: 1024, dataUrl: 'data:image/png;base64,iVBORw0KGgo=', createdAt: '2026-07-17T00:00:00.000Z' }], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Prepare kickoff' }));
    await user.click(screen.getByRole('button', { name: 'Preview attachment mockup.png' }));

    expect(screen.getByRole('dialog', { name: 'Attachment preview' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'mockup.png' })).toBeInTheDocument();
  });

  it('renders a resize handle for the Activity panel', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Prepare kickoff' }));
    expect(screen.getByRole('separator', { name: 'Resize activity panel' })).toBeInTheDocument();
  });
  it('sends a local comment with file and link attachments', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Prepare kickoff' }));
    await user.upload(screen.getByLabelText('Attach file to comment'), new File(['brief'], 'launch-brief.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: 'Add link to comment' }));
    await user.type(screen.getByLabelText('Comment link'), 'https://example.com/brief');
    await user.click(screen.getByRole('button', { name: 'Attach link' }));
    await user.type(screen.getByLabelText('Comment'), 'Here is the brief.');
    await user.click(screen.getByRole('button', { name: 'Send comment' }));

    expect(await screen.findByText('launch-brief.pdf')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://example.com/brief' })).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('launch-brief.pdf');
  });
  it('inserts an emoji from the chat composer picker', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Prepare kickoff' }));
    await user.click(screen.getByRole('button', { name: 'Add emoji to comment' }));
    expect(screen.getByRole('dialog', { name: 'Emoji picker' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add ÃƒÂ°Ã…Â¸Ã‹Å“Ã¢â€šÂ¬ emoji' }));

    expect(screen.getByLabelText('Comment')).toHaveValue('ÃƒÂ°Ã…Â¸Ã‹Å“Ã¢â€šÂ¬');
  });
  it('shows the mock sender name for a local comment', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-1', title: 'Prepare kickoff', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Prepare kickoff' }));
    await user.type(screen.getByLabelText('Comment'), 'Ready for review.');
    await user.click(screen.getByRole('button', { name: 'Send comment' }));

    expect(await screen.findByText('Khanh Tran')).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('Khanh Tran');
  });
  it('creates a scoped status from Add group and persists it locally', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('tab', { name: 'Board' }));
    await user.click(screen.getByRole('button', { name: 'Add group' }));
    await user.type(screen.getByLabelText('Status name'), 'QA review');
    await user.click(screen.getByRole('radio', { name: /Entire Space/ }));
    await user.click(screen.getByRole('button', { name: 'Create status' }));

    expect(screen.getByText('QA REVIEW')).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('QA review');
  });  it('renames and recolors a scoped status from its group options', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('tab', { name: 'Board' }));
    await user.click(screen.getByRole('button', { name: 'Add group' }));
    await user.type(screen.getByLabelText('Status name'), 'QA review');
    await user.click(screen.getByRole('button', { name: 'Create status' }));
    await user.click(screen.getByRole('button', { name: 'Status options QA REVIEW' }));
    await user.click(screen.getByRole('menuitem', { name: 'Rename status' }));
    await user.clear(screen.getByLabelText('Status name'));
    await user.type(screen.getByLabelText('Status name'), 'Ready');
    await user.click(screen.getByRole('button', { name: 'Status color rose' }));
    await user.click(screen.getByRole('button', { name: 'Save status' }));

    expect(screen.getByText('READY')).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('"name":"Ready"');
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('"color":"rose"');
  });  it('keeps one status menu open and closes it on an outside click', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [], statusGroups: [{ id: 'status-done', name: 'Done', scope: 'list' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&list=list-roadmap');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('tab', { name: 'Board' }));
    await user.click(screen.getByRole('button', { name: 'Status options DONE' }));
    expect(screen.getAllByRole('menu')).toHaveLength(1);

    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });  it('renders Board data from local Lists for a Space and Folder scope', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-a', name: 'Product', kind: 'folder' },
        { id: 'folder-b', name: 'Marketing', kind: 'folder' },
        { id: 'list-a', name: 'Roadmap', kind: 'list', parentId: 'folder-a', tasks: [{ id: 'task-a', title: 'Ship local product task', status: 'Backlog', priority: 'Normal', assignee: 'Me', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
        { id: 'list-b', name: 'Campaign', kind: 'list', parentId: 'folder-b', tasks: [{ id: 'task-b', title: 'Plan local campaign task', status: 'In progress', priority: 'High', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1');
    const result = render(<WorkspaceRoot />);
    await user.click(await screen.findByRole('tab', { name: 'Board' }));
    expect(screen.getByRole('button', { name: 'Ship local product task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Plan local campaign task' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'List' }));
    expect(screen.getByRole('button', { name: 'Ship local product task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Plan local campaign task' })).toBeInTheDocument();

    result.unmount();
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-a');
    render(<WorkspaceRoot />);
    await user.click(await screen.findByRole('tab', { name: 'Board' }));
    expect(screen.getByRole('button', { name: 'Ship local product task' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Plan local campaign task' })).not.toBeInTheDocument();
  });  it('renders Overview recent work and docs from local Space and Folder data', async () => {
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-a', name: 'Product', kind: 'folder' },
        { id: 'folder-b', name: 'Marketing', kind: 'folder' },
        { id: 'list-a', name: 'Roadmap', kind: 'list', parentId: 'folder-a', tasks: [{ id: 'task-a', title: 'Local product overview task', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
        { id: 'list-b', name: 'Campaign', kind: 'list', parentId: 'folder-b', tasks: [{ id: 'task-b', title: 'Local marketing overview task', status: 'In progress', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' }] },
        { id: 'doc-a', name: 'Local product brief', kind: 'doc', parentId: 'folder-a' },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1');
    const result = render(<WorkspaceRoot />);
    expect(await screen.findByText('Local product overview task')).toBeInTheDocument();
    expect(screen.getByText('Local marketing overview task')).toBeInTheDocument();
    expect(screen.getByText('Local product brief')).toBeInTheDocument();

    result.unmount();
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-a');
    render(<WorkspaceRoot />);
    expect(await screen.findByText('Local product overview task')).toBeInTheDocument();
    expect(screen.queryByText('Local marketing overview task')).not.toBeInTheDocument();
    expect(screen.getByText('Local product brief')).toBeInTheDocument();
  });
  it('opens a local Doc workspace and persists its editor content', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'doc-notes', name: 'Project Notes', kind: 'doc', parentId: 'folder-projects', document: { content: 'Initial brief', updatedAt: '2026-07-17T00:00:00.000Z' } },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&doc=doc-notes');
    render(<WorkspaceRoot />);

    expect(await screen.findByRole('heading', { name: 'Project Notes' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Document content' })).toHaveAttribute('contenteditable', 'true');
    expect(screen.getByRole('textbox', { name: 'Document content' })).toHaveTextContent('Initial brief');
    expect(screen.queryByText(/Ask ClickFlow AI to structure this brief/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to Folder' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('heading', { name: 'Project Notes' }));
    const titleEditor = screen.getByRole('textbox', { name: 'Document title' });
    expect(titleEditor.tagName).toBe('H1');
    expect(titleEditor).toHaveAttribute('contenteditable', 'true');
    await user.clear(titleEditor);
    await user.type(titleEditor, 'Release brief{Enter}');
    expect(screen.getByRole('heading', { name: 'Release brief' })).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('Release brief');
    await user.clear(screen.getByLabelText('Document content'));
    await user.type(screen.getByLabelText('Document content'), 'Updated project brief');

    expect(window.localStorage.getItem(LOCAL_SPACES_STORAGE_KEY)).toContain('Updated project brief');
  });
  it('pins the Docs pages panel while the document content scrolls', async () => {
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'doc-notes', name: 'Project Notes', kind: 'doc', parentId: 'folder-projects', document: { content: '<p>Long brief</p>', updatedAt: '2026-07-17T00:00:00.000Z' } },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&doc=doc-notes');
    render(<WorkspaceRoot />);

    expect((await screen.findByText('Pages')).closest('aside')).toHaveClass('lg:sticky', 'lg:top-[7.5rem]', 'lg:self-start', 'lg:overflow-y-auto');
  });
  it('pins the document breadcrumb and actions beneath the application header', async () => {
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'doc-notes', name: 'Project Notes', kind: 'doc', parentId: 'folder-projects', document: { content: '<p>Long brief</p>', updatedAt: '2026-07-17T00:00:00.000Z' } },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&doc=doc-notes');
    render(<WorkspaceRoot />);

    expect((await screen.findByRole('button', { name: 'ClickFlow AI' })).closest('header')).toHaveClass('sticky', 'top-16', 'z-20');
  });
  it('opens a local Doc from the Overview Docs card', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'doc-notes', name: 'Project Notes', kind: 'doc', parentId: 'folder-projects', document: { content: '', updatedAt: '2026-07-17T00:00:00.000Z' } },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: /Project Notes/ }));

    expect(await screen.findByRole('heading', { name: 'Project Notes' })).toBeInTheDocument();
  });
  it('opens the Docs slash command menu from the block editor', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([{ id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [{ id: 'folder-projects', name: 'Projects', kind: 'folder' }, { id: 'doc-notes', name: 'Project Notes', kind: 'doc', parentId: 'folder-projects', document: { content: '', updatedAt: '2026-07-17T00:00:00.000Z' } }] }]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&doc=doc-notes');
    render(<WorkspaceRoot />);

    await user.type(await screen.findByRole('textbox', { name: 'Document content' }), '/');

    expect(screen.getByRole('menu', { name: 'Document commands' })).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Heading 1' }));
    expect(screen.getByRole('textbox', { name: 'Document content' })).toHaveAttribute('data-block-style', 'heading-1');
    expect(screen.queryByRole('button', { name: 'Blank page' })).not.toBeInTheDocument();
  });
  it('shows slash commands from the active rich-text block', async () => {
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'doc-notes', name: 'Project Notes', kind: 'doc', parentId: 'folder-projects', document: { content: '<h2>Scope</h2><p>Existing text</p><p>/</p>', updatedAt: '2026-07-17T00:00:00.000Z' } },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&doc=doc-notes');
    render(<WorkspaceRoot />);

    const editor = await screen.findByRole('textbox', { name: 'Document content' });
    const slashText = editor.lastElementChild?.firstChild;
    const range = document.createRange();
    range.setStart(slashText!, 1);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    fireEvent.input(editor);

    expect(screen.getByRole('menu', { name: 'Document commands' })).toBeInTheDocument();
  });
  it('links a local task into the document editor', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([{ id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [{ id: 'folder-projects', name: 'Projects', kind: 'folder' }, { id: 'list-roadmap', name: 'Roadmap', kind: 'list', parentId: 'folder-projects', tasks: [{ id: 'task-launch', title: 'Draft launch brief', status: 'Backlog', priority: 'Normal', assignee: '', startDate: '', dueDate: '', timeEstimate: '', trackingStartedAt: null, trackedSeconds: 0, tags: [], description: '', comments: [], attachments: [], createdAt: '2026-07-17T00:00:00.000Z' }] }, { id: 'doc-notes', name: 'Project Notes', kind: 'doc', parentId: 'folder-projects', document: { content: '', updatedAt: '2026-07-17T00:00:00.000Z' } }] }]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&doc=doc-notes');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Link Task or Doc' }));
    await user.click(screen.getByRole('menuitem', { name: 'Task: Draft launch brief' }));

    expect(screen.getByRole('textbox', { name: 'Document content' })).toHaveTextContent('[Task: Draft launch brief]');
  });
  it('offers Word import and export from a document page menu', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'doc-notes', name: 'Project Notes', kind: 'doc', parentId: 'folder-projects', document: { content: 'Initial brief', updatedAt: '2026-07-17T00:00:00.000Z' } },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&doc=doc-notes');
    render(<WorkspaceRoot />);

    await user.click(await screen.findByRole('button', { name: 'Page options Project Notes' }));

    expect(screen.getByRole('menuitem', { name: 'Import .docx' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Export .docx' })).toBeInTheDocument();
  });
  it('renders a Word-style text formatting toolbar in the document editor', async () => {
    window.localStorage.setItem(LOCAL_SPACES_STORAGE_KEY, JSON.stringify([
      { id: 'space-1', name: 'Space 1', tone: 'bg-indigo-500', items: [
        { id: 'folder-projects', name: 'Projects', kind: 'folder' },
        { id: 'doc-notes', name: 'Project Notes', kind: 'doc', parentId: 'folder-projects', document: { content: '<p>Draft release notes</p>', updatedAt: '2026-07-17T00:00:00.000Z' } },
      ] },
    ]));
    window.history.replaceState(null, '', '/projects?space=space-1&folder=folder-projects&doc=doc-notes');
    render(<WorkspaceRoot />);

    expect(await screen.findByRole('toolbar', { name: 'Text formatting' })).toHaveClass('sticky', 'top-32', 'z-10');
    expect(screen.getByRole('button', { name: 'Bold selection' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Link selection' })).toBeInTheDocument();
  });});
