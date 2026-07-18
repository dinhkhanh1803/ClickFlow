import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';

import { DatabaseHealthService } from '../database/database-health.service';

export class HealthResponseDto {
  @ApiProperty({ type: String, enum: ['ok'], example: 'ok' })
  status!: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(DatabaseHealthService) private readonly databaseHealth: DatabaseHealthService) {}

  @Get('live')
  @ApiOperation({ summary: 'Check whether the API process is alive' })
  @ApiOkResponse({ type: HealthResponseDto })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check whether the API is ready to serve traffic' })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL is unavailable' })
  async ready(): Promise<{ status: 'ok' }> {
    await this.databaseHealth.assertReady();
    return { status: 'ok' };
  }
}
