import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';

import { assertCanDeleteComment, assertCanUpdateComment } from './comment-policy';

describe('comment policy', () => {
  it('allows only the author to update content', () => {
    expect(() => assertCanUpdateComment('author', 'author')).not.toThrow();
    expect(() => assertCanUpdateComment('owner', 'author')).toThrow(ForbiddenException);
  });

  it('allows the author or workspace owner to delete', () => {
    expect(() => assertCanDeleteComment('author', 'author', WorkspaceRole.MEMBER)).not.toThrow();
    expect(() => assertCanDeleteComment('owner', 'author', WorkspaceRole.OWNER)).not.toThrow();
    expect(() => assertCanDeleteComment('member', 'author', WorkspaceRole.MEMBER)).toThrow(ForbiddenException);
  });
});
