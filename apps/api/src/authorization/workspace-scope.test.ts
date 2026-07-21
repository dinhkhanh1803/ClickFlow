import { withWorkspaceScope } from './workspace-scope';

describe('withWorkspaceScope', () => {
  it('cannot be overridden by an attacker-controlled workspace filter', () => {
    expect(withWorkspaceScope('trusted-workspace', {
      workspaceId: 'attacker-workspace',
      projectId: 'project-a'
    })).toEqual({ workspaceId: 'trusted-workspace', projectId: 'project-a' });
  });
});
