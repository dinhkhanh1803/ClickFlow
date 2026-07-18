import { timingSafeEqual } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';

export class CsrfService {
  assertValid(headerToken: string | undefined, cookieToken: string | undefined): void {
    if (!headerToken || !cookieToken) throw new ForbiddenException('CSRF token is required');
    const header = Buffer.from(headerToken);
    const cookie = Buffer.from(cookieToken);
    if (header.length !== cookie.length || !timingSafeEqual(header, cookie)) {
      throw new ForbiddenException('CSRF token is invalid');
    }
  }
}
