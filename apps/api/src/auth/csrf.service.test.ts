import { ForbiddenException } from '@nestjs/common';

import { CsrfService } from './csrf.service';

describe('CsrfService', () => {
  const service = new CsrfService();

  it('accepts matching double-submit tokens', () => {
    expect(() => service.assertValid('csrf-value', 'csrf-value')).not.toThrow();
  });

  it('rejects missing or mismatched tokens', () => {
    expect(() => service.assertValid(undefined, 'csrf-value')).toThrow(ForbiddenException);
    expect(() => service.assertValid('other-value', 'csrf-value')).toThrow(ForbiddenException);
  });
});
