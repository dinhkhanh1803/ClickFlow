import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AttachmentService } from './attachment.service';

async function main() {
  const workspaceId = process.argv[2];
  if (!workspaceId) throw new Error('Usage: cleanup:attachments <workspaceId>');
  const context = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const removed = await context.get(AttachmentService).cleanupOrphans(workspaceId);
    process.stdout.write(JSON.stringify({ workspaceId, removed }));
  } finally {
    await context.close();
  }
}

void main();
