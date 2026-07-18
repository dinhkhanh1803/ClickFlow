import { BadRequestException } from '@nestjs/common';

import { validateIdempotencyKey } from './idempotency-key';

describe('validateIdempotencyKey', () => {
  it('accepts a bounded printable key', () => {
    expect(validateIdempotencyKey('task-create-01HZY8WGW0R0K6AS9K5MY6Q8DK')).toBe('task-create-01HZY8WGW0R0K6AS9K5MY6Q8DK');
  });

  it.each([undefined, '', 'short', 'contains spaces and is invalid'])('rejects a missing or unsafe key', (value) => {
    expect(() => validateIdempotencyKey(value)).toThrow(BadRequestException);
  });
});
