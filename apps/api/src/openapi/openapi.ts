import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

const openApiConfiguration = new DocumentBuilder()
  .setTitle('ClickFlow API')
  .setDescription('Versioned REST API for ClickFlow workspaces and projects.')
  .setVersion('1.0.0')
  .addBearerAuth()
  .build();

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(app, openApiConfiguration, {
    operationIdFactory: (controllerKey, methodKey) => `${controllerKey}_${methodKey}`
  });
}

export function setupOpenApi(app: INestApplication): void {
  SwaggerModule.setup('api/docs', app, createOpenApiDocument(app), {
    jsonDocumentUrl: 'api/docs/openapi.json'
  });
}
