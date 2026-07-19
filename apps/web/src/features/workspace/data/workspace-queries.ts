'use client';

import type { CreateProjectRequest, CreateSectionRequest, CreateWorkspaceRequest, ProjectResponse, SectionResponse } from '@clickflow/contracts';
import { QueryClient, QueryClientContext, useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { useContext, useMemo } from 'react';

import { useAuthStore } from '@/features/auth/model/auth-store';
import { workspaceApi } from './workspace-api';
import { mapWorkspaceTree } from './workspace-navigation-adapter';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  projects: (workspaceId: string) => ['workspaces', workspaceId, 'projects'] as const,
  sections: (workspaceId: string, projectId: string) => ['workspaces', workspaceId, 'projects', projectId, 'sections'] as const
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
  const pending = authenticated && (workspacesQuery.isPending || projectQueries.some((query) => query.isPending) || sectionQueries.some((query) => query.isPending));
  const error = authenticated ? workspacesQuery.error ?? projectQueries.find((query) => query.error)?.error ?? sectionQueries.find((query) => query.error)?.error ?? null : null;
  const data = workspacesQuery.data && !pending && !error ? mapWorkspaceTree(workspacesQuery.data, projects, sections) : undefined;

  return { data, projects, sections, isLoading: pending, isError: Boolean(error), error, usesApi: authenticated };
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
