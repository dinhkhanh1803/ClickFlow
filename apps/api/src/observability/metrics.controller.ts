import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

import { Public } from '../auth/public.decorator';
import { PrismaService } from '../database/prisma.service';
import { MetricsService, type MetricsSnapshot } from './metrics.service';

class MetricsResponseDto {
  @ApiProperty({ type: Number }) requestsTotal!: number;
  @ApiProperty({ type: Number }) errorsTotal!: number;
  @ApiProperty({ type: Number }) errorRate!: number;
  @ApiProperty({ type: Number }) averageLatencyMs!: number;
  @ApiProperty({ type: Number }) activeRequests!: number;
  @ApiProperty({ type: Number, nullable: true }) databaseConnections!: number | null;
  @ApiProperty({ type: Number, nullable: true }) databaseConnectionLimit!: number | null;
}

@Public()
@ApiTags('observability')
@Controller('metrics')
export class MetricsController {
  constructor(
    @Inject(MetricsService) private readonly metrics: MetricsService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get basic process and PostgreSQL metrics' })
  @ApiOkResponse({ type: MetricsResponseDto })
  async getMetrics(): Promise<MetricsSnapshot & { databaseConnections: number | null; databaseConnectionLimit: number | null }> {
    try {
      const [row] = await this.prisma.$queryRaw<Array<{ activeConnections: number; connectionLimit: number }>>(Prisma.sql`
        SELECT numbackends::int AS "activeConnections",
               current_setting('max_connections')::int AS "connectionLimit"
        FROM pg_stat_database
        WHERE datname = current_database()
      `);
      return {
        ...this.metrics.snapshot(),
        databaseConnections: row?.activeConnections ?? null,
        databaseConnectionLimit: row?.connectionLimit ?? null
      };
    } catch {
      return { ...this.metrics.snapshot(), databaseConnections: null, databaseConnectionLimit: null };
    }
  }
}
