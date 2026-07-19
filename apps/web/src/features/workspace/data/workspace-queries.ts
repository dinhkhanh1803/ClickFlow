'use client';

import { SPACE_ROOT_PROJECT_TONE, type CreateProjectRequest, type CreateProjectStatusRequest, type CreateSectionRequest, type CreateWorkspaceRequest, type ProjectResponse, type ProjectStatusResponse, type SectionResponse, type TaskApiResponse, type TaskCreateRequest, type TaskUpdateRequest, type UpdateProjectStatusRequest } from '@clickflow/contracts';
import { QueryClient, QueryClientContext, useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { useContext, useMemo } from 'react';

import { useAuthStore } from '@/features/auth/model/auth-store';
import { taskApi } from './task-api';
import { timeTrackingApi } from '@/features/time-tracking/data/time-tracking-api';
import { commentApi } from './comment-api';
import { workspaceApi } from './workspace-api';
import { mapWorkspaceTree } from './workspace-navigation-adapter';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  projects: (workspaceId: string) => ['workspaces', workspaceId, 'projects'] as const,
  sections: (workspaceId: string, projectId: string) => ['workspaces', workspaceId, 'projects', projectId, 'sections'] as const,
  statuses: (workspaceId: string, projectId: string) => ['workspaces', workspaceId, 'projects', projectId, 'statuses'] as const,
  tasks: (workspaceId: string, projectId: string) => ['workspaces', workspaceId, 'projects', projectId, 'tasks'] as const,
  comments: (workspaceId: string, taskId: string) => ['workspaces', workspaceId, 'tasks', taskId, 'comments'] as const,
  activity: (workspaceId: string, taskId: string) => ['workspaces', workspaceId, 'tasks', taskId, 'activity'] as const,
  timeEntries: (workspaceId: string) => ['workspaces', workspaceId, 'time-entries'] as const
};

function requireToken(accessToken: string | null): string {
  if (!accessToken) throw new Error('An authenticated session is required');
  return accessToken;
}

const fallbackQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function useWorkspaceQueryClient() {
  return useContext(QueryClientContext) ?? fallbackQueryClient;
}


export function useWorkspaceNavigationQuery(enabled = true) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const authenticated = useAuthStore((state) => state.status === 'authenticated') && enabled;
  const queryClient = useWorkspaceQueryClient();
  const workspacesQuery = useQuery({
    queryKey: workspaceKeys.all,
    queryFn: () => workspaceApi.listWorkspaces(requireToken(accessToken)),
    enabled: authenticated && Boolean(accessToken)
  }, queryClient);
  const workspaceIds = useMemo(() => workspacesQuery.data?.map(({ id }) => id) ?? [], [workspacesQuery.data]);
  const projectQueries = useQueries({ queries: workspaceIds.map((workspaceId) => ({
    queryKey: workspaceKeys.projects(workspaceId),
    queryFn: () => workspaceApi.listProjects(requireToken(accessToken), workspaceId)
  })) }, queryClient);
  const projects = useMemo<ProjectResponse[]>(() => projectQueries.flatMap((query) => query.data?.items ?? []), [projectQueries]);
  const sectionQueries = useQueries({ queries: projects.map((project) => ({
    queryKey: workspaceKeys.sections(project.workspaceId, project.id),
    queryFn: () => workspaceApi.listSections(requireToken(accessToken), project.workspaceId, project.id)
  })) }, queryClient);
  const sections = useMemo<SectionResponse[]>(() => sectionQueries.flatMap((query) => query.data ?? []), [sectionQueries]);
  const statusQueries = useQueries({ queries: projects.map((project) => ({
    queryKey: workspaceKeys.statuses(project.workspaceId, project.id),
    queryFn: () => workspaceApi.listStatuses(requireToken(accessToken), project.workspaceId, project.id)
  })) }, queryClient);
  const taskQueries = useQueries({ queries: projects.map((project) => ({
    queryKey: workspaceKeys.tasks(project.workspaceId, project.id),
    queryFn: () => taskApi.list(requireToken(accessToken), project.workspaceId, project.id)
  })) }, queryClient);
  const statuses = useMemo<ProjectStatusResponse[]>(() => statusQueries.flatMap((query) => query.data ?? []), [statusQueries]);
  const tasks = useMemo<TaskApiResponse[]>(() => taskQueries.flatMap((query) => query.data?.items ?? []), [taskQueries]);
  const commentQueries = useQueries({ queries: tasks.map((task) => ({
    queryKey: workspaceKeys.comments(task.workspaceId, task.id),
    queryFn: () => commentApi.list(requireToken(accessToken), task.workspaceId, task.id)
  })) }, queryClient);
  const activityQueries = useQueries({ queries: tasks.map((task) => ({
    queryKey: workspaceKeys.activity(task.workspaceId, task.id),
    queryFn: () => commentApi.activity(requireToken(accessToken), task.workspaceId, task.id)
  })) }, queryClient);
  const comments = useMemo(() => commentQueries.flatMap((query) => query.data?.items ?? []), [commentQueries]);
  const activities = useMemo(() => activityQueries.flatMap((query) => query.data?.items ?? []), [activityQueries]);
  const timeEntryQueries = useQueries({ queries: workspaceIds.map((workspaceId) => ({
    queryKey: workspaceKeys.timeEntries(workspaceId),
    queryFn: () => timeTrackingApi.list(requireToken(accessToken), workspaceId)
  })) }, queryClient);
  const timeEntries = useMemo(() => timeEntryQueries.flatMap((query) => query.data?.items ?? []), [timeEntryQueries]);
  const allQueries = [...projectQueries, ...sectionQueries, ...statusQueries, ...taskQueries, ...commentQueries, ...activityQueries, ...timeEntryQueries];
  const pending = authenticated && (workspacesQuery.isPending || allQueries.some((query) => query.isPending));
  const error = authenticated ? workspacesQuery.error ?? allQueries.find((query) => query.error)?.error ?? null : null;
  const data = workspacesQuery.data && !pending && !error ? mapWorkspaceTree(workspacesQuery.data, projects, sections, statuses, tasks, comments, activities, timeEntries) : undefined;

  return { data, projects, sections, statuses, tasks, comments, activities, timeEntries, isLoading: pending, isError: Boolean(error), error, usesApi: authenticated };
}

export function useCreateWorkspaceMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: (input: CreateWorkspaceRequest) => workspaceApi.createWorkspace(requireToken(accessToken), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.all })
  }, queryClient);
}

export function useCreateProjectMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, input }: { workspaceId: string; input: CreateProjectRequest }) => workspaceApi.createProject(requireToken(accessToken), workspaceId, input),
    onSuccess: (_project, variables) => queryClient.invalidateQueries({ queryKey: workspaceKeys.projects(variables.workspaceId) })
  }, queryClient);
}

export function useUpdateProjectMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, projectId, name }: { workspaceId: string; projectId: string; name: string }) => workspaceApi.updateProject(requireToken(accessToken), workspaceId, projectId, { name }),
    onSuccess: (_project, variables) => queryClient.invalidateQueries({ queryKey: workspaceKeys.projects(variables.workspaceId) })
  }, queryClient);
}

export function useArchiveProjectMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, projectId }: { workspaceId: string; projectId: string }) => workspaceApi.archiveProject(requireToken(accessToken), workspaceId, projectId),
    onSuccess: (_result, variables) => queryClient.invalidateQueries({ queryKey: workspaceKeys.projects(variables.workspaceId) })
  }, queryClient);
}

export function useCreateSectionMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, projectId, input }: { workspaceId: string; projectId: string; input: CreateSectionRequest }) => workspaceApi.createSection(requireToken(accessToken), workspaceId, projectId, input),
    onSuccess: (_section, variables) => queryClient.invalidateQueries({ queryKey: workspaceKeys.sections(variables.workspaceId, variables.projectId) })
  }, queryClient);
}

export function useUpdateSectionMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, projectId, sectionId, name }: { workspaceId: string; projectId: string; sectionId: string; name: string }) => workspaceApi.updateSection(requireToken(accessToken), workspaceId, projectId, sectionId, { name }),
    onSuccess: (_section, variables) => queryClient.invalidateQueries({ queryKey: workspaceKeys.sections(variables.workspaceId, variables.projectId) })
  }, queryClient);
}

export function useArchiveSectionMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, projectId, sectionId }: { workspaceId: string; projectId: string; sectionId: string }) => workspaceApi.archiveSection(requireToken(accessToken), workspaceId, projectId, sectionId),
    onSuccess: (_result, variables) => queryClient.invalidateQueries({ queryKey: workspaceKeys.sections(variables.workspaceId, variables.projectId) })
  }, queryClient);
}

export function useCreateRootSectionMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: async ({ workspaceId, name }: { workspaceId: string; name: string }) => {
      const token = requireToken(accessToken);
      const projects = await workspaceApi.listProjects(token, workspaceId);
      let container = projects.items.find((project) => project.tone === SPACE_ROOT_PROJECT_TONE && project.archivedAt === null);
      if (!container) {
        container = await workspaceApi.createProject(token, workspaceId, { name: 'Space Lists', tone: SPACE_ROOT_PROJECT_TONE });
      }
      return workspaceApi.createSection(token, workspaceId, container.id, { name });
    },
    onSuccess: (section, variables) => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.projects(variables.workspaceId) });
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.sections(variables.workspaceId, section.projectId) });
    }
  }, queryClient);
}

export function useCreateTaskMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, input }: { workspaceId: string; input: TaskCreateRequest }) => taskApi.create(requireToken(accessToken), workspaceId, input),
    onSuccess: (_task, variables) => queryClient.invalidateQueries({ queryKey: workspaceKeys.tasks(variables.workspaceId, variables.input.projectId) })
  }, queryClient);
}

export function useUpdateTaskMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: (variables: { workspaceId: string; projectId: string; taskId: string; input: TaskUpdateRequest }) => taskApi.update(requireToken(accessToken), variables.workspaceId, variables.taskId, variables.input),
    onSuccess: (_task, variables) => queryClient.invalidateQueries({ queryKey: workspaceKeys.tasks(variables.workspaceId, variables.projectId) })
  }, queryClient);
}

export function useArchiveTaskMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: (variables: { workspaceId: string; projectId: string; taskId: string; version: number }) => taskApi.archive(requireToken(accessToken), variables.workspaceId, variables.taskId, variables.version),
    onSuccess: (_task, variables) => queryClient.invalidateQueries({ queryKey: workspaceKeys.tasks(variables.workspaceId, variables.projectId) })
  }, queryClient);
}


export function useStartTimerMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, taskId }: { workspaceId: string; taskId: string }) => timeTrackingApi.start(requireToken(accessToken), workspaceId, taskId),
    onSuccess: (entry, variables) => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.timeEntries(variables.workspaceId) });
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.activity(variables.workspaceId, entry.taskId) });
    }
  }, queryClient);
}

export function useStopTimerMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId }: { workspaceId: string }) => timeTrackingApi.stop(requireToken(accessToken), workspaceId),
    onSuccess: (entry, variables) => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.timeEntries(variables.workspaceId) });
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.activity(variables.workspaceId, entry.taskId) });
    }
  }, queryClient);
}
export function useCreateCommentMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, taskId, body }: { workspaceId: string; taskId: string; body: string }) => commentApi.create(requireToken(accessToken), workspaceId, taskId, body),
    onSuccess: (_comment, variables) => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.comments(variables.workspaceId, variables.taskId) });
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.activity(variables.workspaceId, variables.taskId) });
    }
  }, queryClient);
}

export function useCreateStatusMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, projectId, input }: { workspaceId: string; projectId: string; input: CreateProjectStatusRequest }) => workspaceApi.createStatus(requireToken(accessToken), workspaceId, projectId, input),
    onSuccess: (_status, variables) => queryClient.invalidateQueries({ queryKey: workspaceKeys.statuses(variables.workspaceId, variables.projectId) })
  }, queryClient);
}

export function useUpdateStatusMutation() {
  const queryClient = useWorkspaceQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, projectId, statusId, input }: { workspaceId: string; projectId: string; statusId: string; input: UpdateProjectStatusRequest }) => workspaceApi.updateStatus(requireToken(accessToken), workspaceId, projectId, statusId, input),
    onSuccess: (_status, variables) => queryClient.invalidateQueries({ queryKey: workspaceKeys.statuses(variables.workspaceId, variables.projectId) })
  }, queryClient);
}
