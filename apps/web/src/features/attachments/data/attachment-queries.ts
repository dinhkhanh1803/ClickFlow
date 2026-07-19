'use client';

import { QueryClient, QueryClientContext, useMutation } from '@tanstack/react-query';
import { useContext } from 'react';

import { useAuthStore } from '@/features/auth/model/auth-store';
import { attachmentApi } from './attachment-api';

const tokenRequired = (token: string | null) => {
  if (!token) throw new Error('An authenticated session is required');
  return token;
};
const fallbackQueryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
const useAttachmentQueryClient = () => useContext(QueryClientContext) ?? fallbackQueryClient;


export function useUploadAttachmentMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useAttachmentQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, taskId, file }: { workspaceId: string; taskId: string; file: File }) =>
      attachmentApi.upload(tokenRequired(token), workspaceId, taskId, file),
  }, queryClient);
}

export function useRemoveAttachmentMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useAttachmentQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, attachmentId }: { workspaceId: string; attachmentId: string }) =>
      attachmentApi.remove(tokenRequired(token), workspaceId, attachmentId),
  }, queryClient);
}
