import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { UpdateProfileInput } from './profile.schemas';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}
  update(userId: string, input: UpdateProfileInput) {
    return this.prisma.user.update({
      where: { id: userId, archivedAt: null },
      data: input,
      select: { id: true, email: true, displayName: true, avatarUrl: true, timezone: true, locale: true }
    });
  }
}
