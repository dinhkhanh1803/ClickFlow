import { describe, expect, it } from 'vitest';

import { parseInviteEmails } from './share-members';

describe('parseInviteEmails', () => {
  it('normalizes comma and newline separated emails and removes duplicates', () => {
    expect(parseInviteEmails(' Bao@ClickFlow.test, linh@clickflow.test\nbao@clickflow.test ')).toEqual([
      'bao@clickflow.test',
      'linh@clickflow.test'
    ]);
  });
});