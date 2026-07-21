'use client';

import type { CreateDocumentRequest, DocumentResponse, UpdateDocumentRequest } from '@clickflow/contracts';
import { QueryClient, QueryClientContext, useMutation } from '@tanstack/react-query';
import { useContext } from 'react';

import { useAuthStore } from '@/features/auth/model/auth-store';
import { documentApi } from './document-api';

export const documentKeys = {
  workspace: (workspaceId: string) => ['workspaces', workspaceId, 'documents'] as const,
};

const fallbackQueryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
const requiredToken = (token: string | null) => {
  if (!token) throw new Error('An authenticated session is required');
  return token;
};

function useDocumentQueryClient() {
  return useContext(QueryClientContext) ?? fallbackQueryClient;
}

export function useCreateDocumentMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useDocumentQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, input }: { workspaceId: string; input: CreateDocumentRequest }) => documentApi.create(requiredToken(token), workspaceId, input),
    onSuccess: (_document, variables) => queryClient.invalidateQueries({ queryKey: documentKeys.workspace(variables.workspaceId) })
  }, queryClient);
}

export function useUpdateDocumentMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useDocumentQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, documentId, input }: { workspaceId: string; documentId: string; input: UpdateDocumentRequest }) => documentApi.update(requiredToken(token), workspaceId, documentId, input),
    onSuccess: (document, variables) => {
      queryClient.setQueryData<DocumentResponse[]>(documentKeys.workspace(variables.workspaceId), (current) => current?.map((item) => item.id === document.id ? document : item));
    }
  }, queryClient);
}

export function useArchiveDocumentMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useDocumentQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, documentId, contentVersion }: { workspaceId: string; documentId: string; contentVersion: number }) => documentApi.archive(requiredToken(token), workspaceId, documentId, { contentVersion }),
    onSuccess: (_result, variables) => queryClient.invalidateQueries({ queryKey: documentKeys.workspace(variables.workspaceId) })
  }, queryClient);
}
