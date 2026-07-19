import { afterEach, describe, expect, it, vi } from 'vitest';

import { taskApi } from './task-api';

afterEach(() => vi.unstubAllGlobals());

describe('taskApi', () => {
  it('loads, creates, updates, and archives workspace-scoped tasks', async () => {
    const json = { id: 'task-1', version: 1 };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [], page: 1, pageSize: 100, total: 0 }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(json), { status: 201, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...json, version: 2 }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await taskApi.list('token', 'workspace-1', 'project-1');
    await taskApi.create('token', 'workspace-1', { projectId: '00000000-0000-4000-8000-000000000020', sectionId: '00000000-0000-4000-8000-000000000030', statusId: '00000000-0000-4000-8000-000000000040', title: 'Ship API' });
    await taskApi.update('token', 'workspace-1', 'task-1', { version: 1, title: 'Ship integration' });
    await taskApi.archive('token', 'workspace-1', 'task-1', 2);

    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringContaining('/workspaces/workspace-1/tasks?page=1&pageSize=100&projectId=project-1'), expect.objectContaining({ method: 'GET' }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringMatching(/workspaces\/workspace-1\/tasks$/), expect.objectContaining({ method: 'POST' }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, expect.stringMatching(/tasks\/task-1$/), expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ version: 1, title: 'Ship integration' }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(4, expect.stringContaining('/tasks/task-1?version=2'), expect.objectContaining({ method: 'DELETE' }));
  });
});
