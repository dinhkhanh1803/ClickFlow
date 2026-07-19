import { afterEach, describe, expect, it, vi } from 'vitest';
import { workspaceApi } from './workspace-api';

afterEach(() => vi.unstubAllGlobals());

describe('workspaceApi', () => {
  it('sends the access token when loading the workspace tree', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [], page: 1, pageSize: 100, total: 0 }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await workspaceApi.listWorkspaces('access-token');
    await workspaceApi.listProjects('access-token', 'workspace-1');
    await workspaceApi.listSections('access-token', 'workspace-1', 'project-1');

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:3001/api/v1/workspaces', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer access-token' }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringContaining('/workspaces/workspace-1/projects?'), expect.objectContaining({ credentials: 'include' }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, expect.stringContaining('/projects/project-1/sections'), expect.any(Object));
  });

  it('uses the API resource mapping for project and section creation', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'project-1' }), { status: 201, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'section-1' }), { status: 201, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await workspaceApi.createProject('token', 'workspace-1', { name: 'Launch' });
    await workspaceApi.createSection('token', 'workspace-1', 'project-1', { name: 'Backlog' });

    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/workspaces\/workspace-1\/projects$/), expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Launch' }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringMatching(/projects\/project-1\/sections$/), expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Backlog' }) }));
  });

  it('creates a workspace through the top-level workspace resource', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(
      JSON.stringify({ id: 'workspace-2', name: 'Booking', role: 'OWNER' }),
      { status: 201, headers: { 'content-type': 'application/json' } }
    ));
    vi.stubGlobal('fetch', fetchMock);

    await workspaceApi.createWorkspace('token', { name: 'Booking' });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/v1/workspaces', expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Booking' }) }));
  });
});
