import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from './prisma.service';

@Injectable()
export class DatabaseHealthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async assertReady(): Promise<void> {
    try {
      await this.prisma.$queryRaw(Prisma.sql`SELECT 1`);
    } catch {
      throw new ServiceUnavailableException('Database is unavailable');
    }
  }
}
