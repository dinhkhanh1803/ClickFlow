import { BadRequestException } from '@nestjs/common';
export function assertTimezone(value: string): void { try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); } catch { throw new BadRequestException('timezone must be a valid IANA timezone'); } }
export function assertLocale(value: string): void { try { new Intl.Locale(value); } catch { throw new BadRequestException('locale must be a valid BCP 47 locale'); } }
