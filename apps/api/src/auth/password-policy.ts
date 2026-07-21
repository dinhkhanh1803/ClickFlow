import { BadRequestException } from '@nestjs/common';

const MIN_PASSWORD_LENGTH = 10;

export function validatePasswordPolicy(password: string): void {
  const valid = password.length >= MIN_PASSWORD_LENGTH
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password);
  if (!valid) {
    throw new BadRequestException('Password must be at least 10 characters and include upper-case, lower-case and numeric characters');
  }
}
