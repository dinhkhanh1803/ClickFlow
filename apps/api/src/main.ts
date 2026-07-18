import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import { loadEnvironment, parseCorsOrigins } from './config/environment';
import { setupOpenApi } from './openapi/openapi';

async function bootstrap(): Promise<void> {
  const environment = loadEnvironment();
  const app = await NestFactory.create(AppModule);
  configureApp(app, { corsOrigins: parseCorsOrigins(environment.CORS_ORIGIN) });
  setupOpenApi(app);
  await app.listen(environment.PORT);
}

void bootstrap();
