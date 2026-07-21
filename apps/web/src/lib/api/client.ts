import type { ApiErrorResponse } from '@clickflow/contracts';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  accessToken?: string;
  body?: unknown;
}

export interface ApiClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(path: string, options?: RequestOptions): Promise<T>;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return typeof value === 'object' && value !== null
    && typeof Reflect.get(value, 'code') === 'string'
    && typeof Reflect.get(value, 'message') === 'string';
}

export function createApiClient(baseUrl: string): ApiClient {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { accessToken, body, headers: customHeaders, ...requestInit } = options;
    const headers = Object.fromEntries(new Headers(customHeaders).entries());
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let response: Response;
    try {
      response = await fetch(`${normalizedBaseUrl}/${path.replace(/^\//, '')}`, {
        ...requestInit,
        credentials: 'include',
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    } catch (cause) {
      throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the ClickFlow API', undefined, cause);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const payload: unknown = response.status === 204
      ? undefined
      : contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
      if (isApiErrorResponse(payload)) {
        throw new ApiError(response.status, payload.code, payload.message, payload.requestId, payload.details);
      }
      throw new ApiError(response.status, 'HTTP_ERROR', `Request failed with status ${response.status}`);
    }

    return payload as T;
  }

  return {
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' })
  };
}
