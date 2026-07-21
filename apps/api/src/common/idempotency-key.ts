import { BadRequestException, CanActivate, ExecutionContext, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const IDEMPOTENCY_METADATA = 'clickflow:require-idempotency-key';
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;

export const RequireIdempotencyKey = () => SetMetadata(IDEMPOTENCY_METADATA, true);

export function validateIdempotencyKey(value: string | undefined): string {
  if (!value || !IDEMPOTENCY_KEY_PATTERN.test(value)) {
    throw new BadRequestException('A valid Idempotency-Key header is required');
  }
  return value;
}

@Injectable()
export class IdempotencyKeyGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(IDEMPOTENCY_METADATA, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required) return true;
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined>; idempotencyKey?: string }>();
    const raw = request.headers['idempotency-key'];
    request.idempotencyKey = validateIdempotencyKey(Array.isArray(raw) ? raw[0] : raw);
    return true;
  }
}
