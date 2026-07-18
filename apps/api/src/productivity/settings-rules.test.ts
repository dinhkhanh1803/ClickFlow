import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertLocale, assertTimezone } from './settings-rules';
describe('settings validation', () => { it('accepts standard timezone/locale and rejects invalid values', () => { expect(() => assertTimezone('Asia/Ho_Chi_Minh')).not.toThrow(); expect(() => assertLocale('vi-VN')).not.toThrow(); expect(() => assertTimezone('secret/value')).toThrow(BadRequestException); }); });
