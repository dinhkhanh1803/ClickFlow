import { BadRequestException } from '@nestjs/common';

import { assertCompleteReorder } from './reorder';

describe('assertCompleteReorder', () => {
  it('accepts each resource exactly once', () => {
    expect(() => assertCompleteReorder(['a', 'b', 'c'], ['c', 'a', 'b'])).not.toThrow();
  });

  it.each([
    [['a', 'b'], ['a']],
    [['a', 'b'], ['a', 'a']],
    [['a', 'b'], ['a', 'c']]
  ])('rejects incomplete, duplicate or foreign IDs', (existing, ordered) => {
    expect(() => assertCompleteReorder(existing, ordered)).toThrow(BadRequestException);
  });
});
