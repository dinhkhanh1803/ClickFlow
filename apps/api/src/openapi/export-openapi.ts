import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { configureApp } from '../bootstrap/configure-app';
import { createOpenApiDocument } from './openapi';

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortDeep(item)])
    );
  }
  return value;
}

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  configureApp(app, { corsOrigins: ['http://localhost:3000'] });
  await app.init();

  const outputPath = resolve(process.cwd(), '../../docs/api/openapi.json');
  const content = `${JSON.stringify(sortDeep(createOpenApiDocument(app)), null, 2)}\n`;

  if (process.argv.includes('--check')) {
    const current = await readFile(outputPath, 'utf8');
    if (current !== content) {
      throw new Error('OpenAPI contract is stale. Run pnpm --filter api openapi:generate.');
    }
  } else {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content, 'utf8');
  }

  await app.close();
}

void exportOpenApi();
