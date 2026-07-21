import type { PrismaService } from '../database/prisma.service';
import { updateProfileSchema } from './profile.schemas';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  it('accepts an image data URL and updates the authenticated user', async () => {
    const updated = { id: 'user-1', email: 'owner@clickflow.local', displayName: 'Owner', avatarUrl: 'data:image/png;base64,YQ==', timezone: 'UTC', locale: 'en' };
    const prisma = { user: { update: vi.fn().mockResolvedValue(updated) } };
    const service = new ProfileService(prisma as unknown as PrismaService);
    const input = updateProfileSchema.parse({ avatarUrl: updated.avatarUrl });

    await expect(service.update('user-1', input)).resolves.toEqual(updated);
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-1', archivedAt: null }, data: input }));
  });

  it('rejects non-image avatar content', () => {
    expect(() => updateProfileSchema.parse({ avatarUrl: 'data:text/plain;base64,YQ==' })).toThrow();
  });
});
