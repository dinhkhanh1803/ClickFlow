import { Module } from '@nestjs/common';

import { AuthorizationModule } from './authorization/authorization.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [DatabaseModule, AuthorizationModule, ObservabilityModule],
  controllers: [HealthController]
})
export class AppModule {}
