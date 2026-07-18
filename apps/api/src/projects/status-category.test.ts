import { StatusCategory } from '@prisma/client';

import { toApiStatusCategory, toPrismaStatusCategory } from './status-category';

describe('status category adapter', () => {
  it('keeps the public contract independent from Prisma storage enums', () => {
    expect(toPrismaStatusCategory('OPEN')).toBe(StatusCategory.NOT_STARTED);
    expect(toPrismaStatusCategory('IN_PROGRESS')).toBe(StatusCategory.ACTIVE);
    expect(toPrismaStatusCategory('COMPLETED')).toBe(StatusCategory.DONE);
    expect(toApiStatusCategory(StatusCategory.CLOSED)).toBe('COMPLETED');
  });
});
