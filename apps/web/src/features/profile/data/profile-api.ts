import type { AuthUserResponse, UpdateProfileRequest } from '@clickflow/contracts';
import { createApiClient } from '@/lib/api/client';
import { apiBaseUrl } from '@/lib/api/environment';
const client = createApiClient(apiBaseUrl);
export const profileApi = { update: (accessToken: string, input: UpdateProfileRequest) => client.patch<AuthUserResponse>('/profile', input, { accessToken }) };
