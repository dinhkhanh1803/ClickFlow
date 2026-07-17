'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Project, Space, Task, TaskPriority, TaskStatus } from './workspace-types';

const seedSpace: Space = {
  id: 'space-clickflow',
  name: 'ClickFlow Product',
  emoji: '✦',
  members: [
    { id: 'khanh', name: 'Khánh', initials: 'KD', color: 'bg-indigo-500' },
    { id: 'linh', name: 'Linh', initials: 'LM', color: 'bg-rose-500' },
    { id: 'tuan', name: 'Tuấn', initials: 'TN', color: 'bg-emerald-500' },
  ],
  projects: [
    {
      id: 'project-product-launch', folderId: 'folder-projects', name: 'Product launch', description: 'Shape the first ClickFlow release and its core work loops.', color: 'indigo', archived: false,
      tasks: [
        { id: 'task-architecture', title: 'Define information architecture', status: 'In progress', priority: 'High', assignee: 'KD', dueDate: '2026-07-18', description: 'Establish the navigation model and the first execution loop for product teams.', checklist: [{ id: 'check-navigation', label: 'Map navigation hierarchy', completed: false }, { id: 'check-projects', label: 'Define project boundaries', completed: true }], comments: [], activity: [{ id: 'activity-1', message: 'Task created for the product launch.', createdAt: 'Just now' }] },
        { id: 'task-workspace', title: 'Design the Space command surface', status: 'Backlog', priority: 'Normal', assignee: 'LM', dueDate: '2026-07-21', description: 'Make the Space useful before a team opens a project.', checklist: [], comments: [], activity: [] },
        { id: 'task-review', title: 'Validate delivery flow', status: 'Done', priority: 'Normal', assignee: 'TN', dueDate: '2026-07-15', description: 'Review the flow with the founding team.', checklist: [], comments: [], activity: [] },
      ],
    },
    {
      id: 'project-growth', name: 'Growth experiments', description: 'Plan and evaluate activation experiments.', color: 'emerald', archived: false,
      tasks: [
        { id: 'task-onboarding', title: 'Outline activation interview', status: 'Backlog', priority: 'High', assignee: 'TN', dueDate: '2026-07-23', description: 'Prepare questions for five target users.', checklist: [], comments: [], activity: [] },
      ],
    },
    { id: 'project-brand', name: 'Brand system', description: 'Keep the ClickFlow visual language coherent.', color: 'violet', archived: false, tasks: [] },
  ],
};

type WorkspaceContextValue = {
  space: Space;
  activeProjectId: string | null;
  selectProject: (projectId: string | null) => void;
  createProject: (input: Pick<Project, 'name' | 'description' | 'folderId'>) => void;
  updateProject: (projectId: string, patch: Partial<Pick<Project, 'name' | 'description' | 'folderId'>>) => void;
  archiveProject: (projectId: string) => void;
  createTask: (projectId: string, title: string) => void;
  updateTask: (projectId: string, taskId: string, patch: Partial<Pick<Task, 'title' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'description'>>) => void;
  toggleChecklistItem: (projectId: string, taskId: string, itemId: string) => void;
  addChecklistItem: (projectId: string, taskId: string, label: string) => void;
  addComment: (projectId: string, taskId: string, body: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function WorkspaceProvider({ children, initialProjectId }: { children: ReactNode; initialProjectId?: string }) {
  const [space, setSpace] = useState(seedSpace);
  const [activeProjectId, selectProject] = useState<string | null>(initialProjectId ?? null);
  const mutateProject = (projectId: string, mutate: (project: Project) => Project) => setSpace((current) => ({ ...current, projects: current.projects.map((project) => project.id === projectId ? mutate(project) : project) }));
  const updateTask = (projectId: string, taskId: string, patch: Partial<Pick<Task, 'title' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'description'>>) => mutateProject(projectId, (project) => ({ ...project, tasks: project.tasks.map((task) => task.id === taskId ? { ...task, ...patch, activity: [...task.activity, { id: id('activity'), message: 'Task details updated.', createdAt: now() }] } : task) }));
  const value = useMemo<WorkspaceContextValue>(() => ({
    space, activeProjectId, selectProject,
    createProject: ({ name, description, folderId }) => { const project = { id: id('project'), name, description, folderId, color: 'sky', archived: false, tasks: [] }; setSpace((current) => ({ ...current, projects: [...current.projects, project] })); selectProject(project.id); },
    updateProject: (projectId, patch) => mutateProject(projectId, (project) => ({ ...project, ...patch })),
    archiveProject: (projectId) => { mutateProject(projectId, (project) => ({ ...project, archived: true })); selectProject(null); },
    createTask: (projectId, title) => mutateProject(projectId, (project) => ({ ...project, tasks: [...project.tasks, { id: id('task'), title, status: 'Backlog' as TaskStatus, priority: 'Normal' as TaskPriority, assignee: 'KD', dueDate: '', description: '', checklist: [], comments: [], activity: [{ id: id('activity'), message: 'Task created.', createdAt: now() }] }] })),
    updateTask,
    toggleChecklistItem: (projectId, taskId, itemId) => mutateProject(projectId, (project) => ({ ...project, tasks: project.tasks.map((task) => task.id !== taskId ? task : { ...task, checklist: task.checklist.map((item) => item.id === itemId ? { ...item, completed: !item.completed } : item), activity: [...task.activity, { id: id('activity'), message: 'Checklist updated.', createdAt: now() }] }) })),
    addChecklistItem: (projectId, taskId, label) => mutateProject(projectId, (project) => ({ ...project, tasks: project.tasks.map((task) => task.id !== taskId ? task : { ...task, checklist: [...task.checklist, { id: id('check'), label, completed: false }] }) })),
    addComment: (projectId, taskId, body) => mutateProject(projectId, (project) => ({ ...project, tasks: project.tasks.map((task) => task.id !== taskId ? task : { ...task, comments: [...task.comments, { id: id('comment'), author: 'You', body, createdAt: now() }], activity: [...task.activity, { id: id('activity'), message: 'Added a comment.', createdAt: now() }] }) })),
  // actions are intentionally recreated with state so every mutation exposes current data.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [space, activeProjectId]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() { const value = useContext(WorkspaceContext); if (!value) throw new Error('useWorkspace must be used within WorkspaceProvider'); return value; }