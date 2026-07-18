import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [DatabaseModule, ObservabilityModule, AuthModule, AuthorizationModule],
  controllers: [HealthController]
})
export class AppModule {}
