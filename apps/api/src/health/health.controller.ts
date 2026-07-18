import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ type: String, enum: ['ok'], example: 'ok' })
  status!: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get('live')
  @ApiOperation({ summary: 'Check whether the API process is alive' })
  @ApiOkResponse({ type: HealthResponseDto })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check whether the API is ready to serve traffic' })
  @ApiOkResponse({ type: HealthResponseDto })
  ready(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
