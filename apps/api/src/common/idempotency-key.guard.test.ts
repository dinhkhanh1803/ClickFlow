import { BadRequestException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import { IdempotencyKeyGuard } from './idempotency-key';

function context(headers: Record<string, string> = {}): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ headers }) })
  } as unknown as ExecutionContext;
}

describe('IdempotencyKeyGuard', () => {
  it('skips endpoints without idempotency metadata', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    const guard = new IdempotencyKeyGuard(reflector as unknown as Reflector);
    expect(guard.canActivate(context())).toBe(true);
  });

  it('rejects a sensitive mutation without a key', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) };
    const guard = new IdempotencyKeyGuard(reflector as unknown as Reflector);
    expect(() => guard.canActivate(context())).toThrow(BadRequestException);
  });
});
