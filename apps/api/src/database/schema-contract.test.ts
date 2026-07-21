import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schema = readFileSync(resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8');

describe('Prisma domain schema', () => {
  it.each([
    'User',
    'Session',
    'PasswordResetToken',
    'Workspace',
    'WorkspaceMember',
    'Project',
    'Section',
    'Document',
    'WorkspaceNavigationItem',
    'TaskStatus',
    'Task',
    'ChecklistItem',
    'Tag',
    'TaskTag',
    'Comment',
    'Attachment',
    'TimeEntry',
    'ActivityLog',
    'ProjectTemplate'
  ])('persists the %s aggregate', (model) => {
    expect(schema).toMatch(new RegExp(`model ${model} \\{`));
  });

  it('uses UUIDs, UTC-aware timestamps and workspace-scoped indexes', () => {
    expect(schema).toMatch(/id\s+String\s+@id @default\(uuid\(\)\) @db\.Uuid/);
    expect(schema).toContain('@db.Timestamptz(3)');
    expect(schema).toContain('@@index([workspaceId');
  });

  it('locks task priority and scoped status names to the shared contract', () => {
    expect(schema).toMatch(/enum TaskPriority\s*{\s*URGENT\s*HIGH\s*NORMAL\s*LOW\s*}/);
    expect(schema).toMatch(/enum StatusScopeType\s*{\s*WORKSPACE\s*PROJECT\s*SECTION\s*}/);
  });
});
