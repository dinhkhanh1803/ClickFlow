'use client';

import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/model/auth-store';
import { attachmentApi } from './attachment-api';

const tokenRequired = (token: string | null) => {
  if (!token) throw new Error('An authenticated session is required');
  return token;
};

export function useUploadAttachmentMutation() {
  const token = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, taskId, file }: { workspaceId: string; taskId: string; file: File }) =>
      attachmentApi.upload(tokenRequired(token), workspaceId, taskId, file),
  });
}

export function useRemoveAttachmentMutation() {
  const token = useAuthStore((state) => state.accessToken);
  return useMutation({
    mutationFn: ({ workspaceId, attachmentId }: { workspaceId: string; attachmentId: string }) =>
      attachmentApi.remove(tokenRequired(token), workspaceId, attachmentId),
  });
}
