import type { Page, Route } from '@playwright/test';

const API_ORIGIN = 'http://localhost:3001';
const API_PREFIX = '/api/v1';
const now = '2026-07-21T00:00:00.000Z';

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'khanh@clickflow.local',
  displayName: 'Khanh',
  avatarUrl: null,
  timezone: 'Asia/Ho_Chi_Minh',
  locale: 'vi-VN'
};

export type CoreApiState = {
  createdWorkspaceRequests: unknown[];
  createdProjectRequests: unknown[];
  createdTaskRequests: unknown[];
  invitedMemberRequests: unknown[];
  duplicatedWorkspaceIds: string[];
  restoredWorkspaceIds: string[];
};

type MockCoreApiOptions = {
  seedPublicViewSpace?: boolean;
  seedProductivityData?: boolean;
};

type Workspace = {
  id: string;
  name: string;
  description: string | null;
  tone: string | null;
  private: boolean;
  publicAccess: 'VIEW' | 'EDIT';
  timezone: string;
  locale: string;
  role: 'OWNER' | 'MEMBER' | 'PUBLIC';
  createdBy: { id: string; displayName: string; avatarUrl: string | null };
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

type Project = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  tone: string | null;
  position: number;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  health: { totalTasks: number; completedTasks: number; overdueTasks: number; progressPercent: number; health: 'ON_TRACK' };
};

type Section = { id: string; projectId: string; name: string; position: number };
type WorkspaceMember = { id: string; userId: string; displayName: string; initials: string; avatarUrl: string | null; role: 'OWNER' | 'MEMBER' };
type Status = { id: string; projectId: string; name: string; color: string; category: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'; completed: boolean; position: number; isSystem: boolean };
type Task = {
  id: string;
  workspaceId: string;
  projectId: string;
  sectionId: string | null;
  statusId: string;
  assigneeId: string | null;
  assignee: null;
  assignees: Array<{ id: string; displayName: string; initials: string; avatarUrl: string | null }>; 
  tags: never[];
  parentTaskId: null;
  title: string;
  description: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  position: number;
  dueAt: string | null;
  estimateMinutes: number | null;
  completedAt: string | null;
  version: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function workspaceResponse(input: Partial<Workspace> & Pick<Workspace, 'id' | 'name'>): Workspace {
  return {
    description: null,
    tone: null,
    private: false,
    publicAccess: 'VIEW',
    timezone: 'Asia/Ho_Chi_Minh',
    locale: 'vi-VN',
    role: 'OWNER',
    createdBy: { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl },
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    ...input
  };
}

function projectResponse(input: Pick<Project, 'id' | 'workspaceId' | 'name'> & Partial<Project>): Project {
  return {
    description: null,
    tone: null,
    position: 0,
    deadline: null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    health: { totalTasks: 0, completedTasks: 0, overdueTasks: 0, progressPercent: 0, health: 'ON_TRACK' },
    ...input
  };
}

function defaultStatuses(projectId: string): Status[] {
  return [
    { id: `${projectId}-status-open`, projectId, name: 'Open', color: '#64748b', category: 'OPEN', completed: false, position: 0, isSystem: true },
    { id: `${projectId}-status-progress`, projectId, name: 'In progress', color: '#3b82f6', category: 'IN_PROGRESS', completed: false, position: 1, isSystem: true },
    { id: `${projectId}-status-complete`, projectId, name: 'Complete', color: '#10b981', category: 'COMPLETED', completed: true, position: 2, isSystem: true }
  ];
}

async function json(route: Route, body: unknown, status = 200) {
  const origin = route.request().headers().origin ?? 'http://127.0.0.1:3002';
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'authorization,content-type,x-csrf-token,idempotency-key',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  });
}

async function emptyOptions(route: Route) {
  const origin = route.request().headers().origin ?? 'http://127.0.0.1:3002';
  await route.fulfill({
    status: 204,
    headers: {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'authorization,content-type,x-csrf-token,idempotency-key',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS'
    }
  });
}

export async function mockCoreApi(page: Page, options: MockCoreApiOptions = {}): Promise<CoreApiState> {
  const state: CoreApiState = { createdWorkspaceRequests: [], createdProjectRequests: [], createdTaskRequests: [], invitedMemberRequests: [], duplicatedWorkspaceIds: [], restoredWorkspaceIds: [] };
  const workspaces: Workspace[] = [];
  const projects = new Map<string, Project[]>();
  const sections = new Map<string, Section[]>();
  const statuses = new Map<string, Status[]>();
  const tasks = new Map<string, Task[]>();
  const members = new Map<string, WorkspaceMember[]>();
  const workspaceSettings = new Map<string, { timezone: string; locale: string; preferences: { weekStartsOn: number; notifications: boolean } }>();
  let workspaceCounter = 1;
  let projectCounter = 1;
  let sectionCounter = 1;
  let taskCounter = 1;
  let memberCounter = 1;

  const canEditWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((item) => item.id === workspaceId);
    return !workspace || workspace.role !== 'PUBLIC' || workspace.publicAccess === 'EDIT';
  };

  if (options.seedPublicViewSpace) {
    const workspace = workspaceResponse({
      id: '00000000-0000-4000-8000-000000000900',
      name: 'Public Readonly',
      description: 'Visible to everyone, editable by owner only',
      private: false,
      publicAccess: 'VIEW',
      role: 'PUBLIC',
      createdBy: { id: '00000000-0000-4000-8000-000000000099', displayName: 'Owner User', avatarUrl: null }
    });
    const project = projectResponse({ id: '00000000-0000-4000-8000-000000000901', workspaceId: workspace.id, name: 'Readonly Folder' });
    const section: Section = { id: '00000000-0000-4000-8000-000000000902', projectId: project.id, name: 'Readonly List', position: 0 };
    workspaces.push(workspace);
    projects.set(workspace.id, [project]);
    statuses.set(project.id, defaultStatuses(project.id));
    sections.set(project.id, [section]);
    tasks.set(project.id, []);
    members.set(workspace.id, []);
    workspaceSettings.set(workspace.id, { timezone: 'Asia/Ho_Chi_Minh', locale: 'vi-VN', preferences: { weekStartsOn: 1, notifications: true } });
  }

  if (options.seedProductivityData) {
    const workspace = workspaceResponse({
      id: '00000000-0000-4000-8000-000000000800',
      name: 'Productivity Hub',
      description: 'Seeded productivity screens',
      private: true,
      publicAccess: 'VIEW',
      role: 'OWNER'
    });
    const project = projectResponse({ id: '00000000-0000-4000-8000-000000000801', workspaceId: workspace.id, name: 'Planning Folder' });
    const section: Section = { id: '00000000-0000-4000-8000-000000000802', projectId: project.id, name: 'Sprint List', position: 0 };
    const status = defaultStatuses(project.id)[0]!;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);
    const task: Task = {
      id: '00000000-0000-4000-8000-000000000803',
      workspaceId: workspace.id,
      projectId: project.id,
      sectionId: section.id,
      statusId: status.id,
      assigneeId: user.id,
      assignee: null,
      assignees: [{ id: user.id, displayName: user.displayName, initials: 'K', avatarUrl: user.avatarUrl }],
      tags: [],
      parentTaskId: null,
      title: 'Review productivity screens',
      description: 'Seeded E2E task',
      priority: 'HIGH',
      position: 0,
      dueAt: dueDate.toISOString(),
      estimateMinutes: 90,
      completedAt: null,
      version: 1,
      archivedAt: null,
      createdAt: now,
      updatedAt: now
    };
    workspaces.push(workspace);
    projects.set(workspace.id, [project]);
    statuses.set(project.id, defaultStatuses(project.id));
    sections.set(project.id, [section]);
    tasks.set(project.id, [task]);
    members.set(workspace.id, [{ id: workspace.id + '-member-owner', userId: user.id, displayName: user.displayName, initials: 'K', avatarUrl: user.avatarUrl, role: 'OWNER' }]);
    workspaceSettings.set(workspace.id, { timezone: 'Asia/Ho_Chi_Minh', locale: 'vi-VN', preferences: { weekStartsOn: 1, notifications: true } });
  }

  await page.route(`${API_ORIGIN}${API_PREFIX}/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return emptyOptions(route);

    const url = new URL(request.url());
    const path = url.pathname.slice(API_PREFIX.length);

    if (request.method() === 'POST' && path === '/auth/login') {
      return json(route, {
        accessToken: 'e2e-access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        csrfToken: 'e2e-csrf-token',
        user
      });
    }

    if (request.method() === 'POST' && path === '/auth/refresh') {
      return json(route, {
        accessToken: 'e2e-access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        csrfToken: 'e2e-csrf-token',
        user
      });
    }

    if (request.method() === 'GET' && path === '/users/assignable') {
      return json(route, [
        { id: user.id, email: user.email, displayName: user.displayName, initials: 'K', avatarUrl: null },
        { id: '00000000-0000-4000-8000-000000000002', email: 'teammate@clickflow.local', displayName: 'Teammate', initials: 'T', avatarUrl: null }
      ]);
    }

    if (request.method() === 'GET' && path === '/workspaces') return json(route, workspaces.filter((workspace) => !workspace.archivedAt));
    if (request.method() === 'GET' && path === '/workspaces/archived') return json(route, workspaces.filter((workspace) => workspace.archivedAt));
    if (request.method() === 'POST' && path === '/workspaces') {
      const input = request.postDataJSON() as { name: string; description?: string | null; private?: boolean; publicAccess?: 'VIEW' | 'EDIT' };
      state.createdWorkspaceRequests.push(input);
      const workspace = workspaceResponse({
        id: `00000000-0000-4000-8000-00000000010${workspaceCounter++}`,
        name: input.name,
        description: input.description ?? null,
        private: input.private ?? false,
        publicAccess: input.publicAccess ?? 'VIEW'
      });
      workspaces.push(workspace);
      projects.set(workspace.id, []);
      members.set(workspace.id, [{ id: workspace.id + '-member-owner', userId: user.id, displayName: user.displayName, initials: 'K', avatarUrl: user.avatarUrl, role: 'OWNER' }]);
      return json(route, workspace, 201);
    }

    const workspaceActionMatch = path.match(/^\/workspaces\/([^/]+)(?:\/(restore|duplicate))?$/);
    if (workspaceActionMatch && request.method() === 'DELETE' && !workspaceActionMatch[2]) {
      const workspaceId = workspaceActionMatch[1]!;
      const workspace = workspaces.find((item) => item.id === workspaceId);
      if (workspace) workspace.archivedAt = new Date('2026-07-21T00:00:00.000Z').toISOString();
      return json(route, { ok: true });
    }
    if (workspaceActionMatch && request.method() === 'POST' && workspaceActionMatch[2] === 'restore') {
      const workspaceId = workspaceActionMatch[1]!;
      const workspace = workspaces.find((item) => item.id === workspaceId);
      if (!workspace) return json(route, { code: 'NOT_FOUND', message: 'Workspace not found' }, 404);
      workspace.archivedAt = null;
      state.restoredWorkspaceIds.push(workspaceId);
      return json(route, workspace);
    }
    if (workspaceActionMatch && request.method() === 'POST' && workspaceActionMatch[2] === 'duplicate') {
      const workspaceId = workspaceActionMatch[1]!;
      const source = workspaces.find((item) => item.id === workspaceId);
      if (!source) return json(route, { code: 'NOT_FOUND', message: 'Workspace not found' }, 404);
      const copy = workspaceResponse({
        ...source,
        id: `00000000-0000-4000-8000-00000000060${workspaceCounter++}`,
        name: `${source.name} copy`,
        archivedAt: null,
        role: 'OWNER',
        createdBy: { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl }
      });
      workspaces.push(copy);
      projects.set(copy.id, []);
      members.set(copy.id, [{ id: copy.id + '-member-owner', userId: user.id, displayName: user.displayName, initials: 'K', avatarUrl: user.avatarUrl, role: 'OWNER' }]);
      workspaceSettings.set(copy.id, { timezone: copy.timezone, locale: copy.locale, preferences: { weekStartsOn: 1, notifications: true } });
      state.duplicatedWorkspaceIds.push(workspaceId);
      return json(route, copy, 201);
    }

    const settingsMatch = path.match(/^\/workspaces\/([^/]+)\/settings$/);
    if (settingsMatch && request.method() === 'GET') return json(route, workspaceSettings.get(settingsMatch[1]!) ?? { timezone: 'Asia/Ho_Chi_Minh', locale: 'vi-VN', preferences: { weekStartsOn: 1, notifications: true } });
    if (settingsMatch && request.method() === 'PATCH') {
      const workspaceId = settingsMatch[1]!;
      const current = workspaceSettings.get(workspaceId) ?? { timezone: 'Asia/Ho_Chi_Minh', locale: 'vi-VN', preferences: { weekStartsOn: 1, notifications: true } };
      const input = request.postDataJSON() as Partial<typeof current>;
      const next = { timezone: input.timezone ?? current.timezone, locale: input.locale ?? current.locale, preferences: { ...current.preferences, ...(input.preferences ?? {}) } };
      workspaceSettings.set(workspaceId, next);
      return json(route, next);
    }

    const membersMatch = path.match(/^\/workspaces\/([^/]+)\/members$/);
    if (membersMatch && request.method() === 'GET') return json(route, members.get(membersMatch[1]!) ?? []);
    if (membersMatch && request.method() === 'POST') {
      const workspaceId = membersMatch[1]!;
      const input = request.postDataJSON() as { email: string; role?: 'MEMBER' };
      state.invitedMemberRequests.push(input);
      const member: WorkspaceMember = { id: `${workspaceId}-member-${memberCounter++}`, userId: '00000000-0000-4000-8000-000000000002', displayName: 'Teammate', initials: 'T', avatarUrl: null, role: input.role ?? 'MEMBER' };
      const existing = members.get(workspaceId) ?? [];
      if (!existing.some((item) => item.userId === member.userId)) members.set(workspaceId, [...existing, member]);
      return json(route, member, 201);
    }
    const projectListMatch = path.match(/^\/workspaces\/([^/]+)\/projects$/);
    if (projectListMatch && request.method() === 'GET') {
      const workspaceId = projectListMatch[1]!;
      const items = projects.get(workspaceId) ?? [];
      return json(route, { items, page: 1, pageSize: 100, total: items.length });
    }
    if (projectListMatch && request.method() === 'POST') {
      const workspaceId = projectListMatch[1]!;
      if (!canEditWorkspace(workspaceId)) return json(route, { code: 'FORBIDDEN', message: 'View-only public Space.' }, 403);
      const input = request.postDataJSON() as { name: string; description?: string | null; tone?: string | null };
      state.createdProjectRequests.push(input);
      const project = projectResponse({ id: `00000000-0000-4000-8000-00000000020${projectCounter++}`, workspaceId, name: input.name, description: input.description ?? null, tone: input.tone ?? null });
      projects.set(workspaceId, [...(projects.get(workspaceId) ?? []), project]);
      statuses.set(project.id, defaultStatuses(project.id));
      sections.set(project.id, []);
      tasks.set(project.id, []);
      return json(route, project, 201);
    }

    const sectionsMatch = path.match(/^\/workspaces\/([^/]+)\/projects\/([^/]+)\/sections$/);
    if (sectionsMatch && request.method() === 'GET') return json(route, sections.get(sectionsMatch[2]!) ?? []);
    if (sectionsMatch && request.method() === 'POST') {
      const workspaceId = sectionsMatch[1]!;
      if (!canEditWorkspace(workspaceId)) return json(route, { code: 'FORBIDDEN', message: 'View-only public Space.' }, 403);
      const projectId = sectionsMatch[2]!;
      const input = request.postDataJSON() as { name: string };
      const section = { id: `00000000-0000-4000-8000-00000000030${sectionCounter++}`, projectId, name: input.name, position: (sections.get(projectId) ?? []).length };
      sections.set(projectId, [...(sections.get(projectId) ?? []), section]);
      return json(route, section, 201);
    }

    const statusesMatch = path.match(/^\/workspaces\/([^/]+)\/projects\/([^/]+)\/statuses$/);
    if (statusesMatch && request.method() === 'GET') return json(route, statuses.get(statusesMatch[2]!) ?? []);

    const tasksMatch = path.match(/^\/workspaces\/([^/]+)\/tasks$/);
    if (tasksMatch && request.method() === 'GET') {
      const projectId = url.searchParams.get('projectId') ?? '';
      const items = tasks.get(projectId) ?? [];
      return json(route, { items, page: 1, pageSize: 100, total: items.length });
    }
    if (tasksMatch && request.method() === 'POST') {
      const workspaceId = tasksMatch[1]!;
      if (!canEditWorkspace(workspaceId)) return json(route, { code: 'FORBIDDEN', message: 'View-only public Space.' }, 403);
      const input = request.postDataJSON() as { projectId: string; sectionId?: string | null; statusId: string; title: string; priority?: Task['priority'] };
      state.createdTaskRequests.push(input);
      const task: Task = {
        id: `00000000-0000-4000-8000-00000000040${taskCounter++}`,
        workspaceId,
        projectId: input.projectId,
        sectionId: input.sectionId ?? null,
        statusId: input.statusId,
        assigneeId: null,
        assignee: null,
        assignees: [],
        tags: [],
        parentTaskId: null,
        title: input.title,
        description: null,
        priority: input.priority ?? 'NORMAL',
        position: (tasks.get(input.projectId) ?? []).length,
        dueAt: null,
        estimateMinutes: null,
        completedAt: null,
        version: 1,
        archivedAt: null,
        createdAt: now,
        updatedAt: now
      };
      tasks.set(input.projectId, [...(tasks.get(input.projectId) ?? []), task]);
      return json(route, task, 201);
    }

    if (request.method() === 'GET' && /\/documents$/.test(path)) return json(route, []);
    if (request.method() === 'GET' && /\/time-entries$/.test(path)) return json(route, { items: [], page: 1, pageSize: 100, total: 0, totalDurationSeconds: 0 });
    if (request.method() === 'GET' && /\/comments$/.test(path)) return json(route, { items: [], nextCursor: null });
    if (request.method() === 'GET' && /\/activity$/.test(path)) return json(route, { items: [], nextCursor: null });
    if (request.method() === 'GET' && /\/tags$/.test(path)) return json(route, []);

    return json(route, { code: 'E2E_UNMOCKED', message: `No mock for ${request.method()} ${path}` }, 500);
  });

  return state;
}




