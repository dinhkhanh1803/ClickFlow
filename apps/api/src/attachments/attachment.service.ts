import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { AuthClientContext } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { MAX_WORKSPACE_ATTACHMENT_BYTES, assertStoredObject, assertStoredObjectMetadata, storageExtensionForMimeType } from './attachment-rules';
import type { CompleteAttachmentInput, UploadIntentInput } from './attachment.schemas';
import { STORAGE_PROVIDER, type StorageProvider } from './storage-provider';

@Injectable()
export class AttachmentService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}
  async createUploadIntent(workspaceId: string, input: UploadIntentInput) {
    await this.assertTask(workspaceId, input.taskId);
    await this.assertWorkspaceAttachmentQuota(workspaceId, input.byteSize);
    const extension = storageExtensionForMimeType(input.mimeType);
    const storageKey = `workspaces/${workspaceId}/attachments/${randomUUID()}.${extension}`;
    return { storageKey, ...await this.storage.createSignedUpload({ storageKey, mimeType: input.mimeType, byteSize: input.byteSize, expiresInSeconds: 600 }) };
  }
  async complete(workspaceId: string, userId: string, input: CompleteAttachmentInput, context: AuthClientContext) {
    await this.assertTask(workspaceId, input.taskId);
    if (!input.storageKey.startsWith(`workspaces/${workspaceId}/attachments/`)) throw new BadRequestException('Storage key is outside the workspace namespace');
    const existing = await this.prisma.attachment.findUnique({ where: { storageKey: input.storageKey } });
    if (existing) return this.response(existing);
    const object = await this.storage.head(input.storageKey);
    if (!object) throw new BadRequestException('Uploaded object was not found');
    if (object.mimeType !== input.mimeType || object.byteSize !== input.byteSize) throw new BadRequestException('Uploaded object metadata does not match the intent');
    if (object.bytes) assertStoredObject(object.mimeType, object.byteSize, object.bytes);
    else assertStoredObjectMetadata(object.mimeType, object.byteSize);
    const attachment = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.attachment.create({ data: { workspaceId, taskId: input.taskId, uploadedById: userId, storageKey: input.storageKey, fileName: input.fileName, mimeType: input.mimeType, byteSize: input.byteSize, checksum: input.checksum ?? object.checksum } });
      await transaction.activityLog.create({ data: { workspaceId, actorId: userId, eventType: 'ATTACHMENT_CREATED', subjectType: 'TASK', subjectId: input.taskId, requestId: context.requestId, metadata: { attachmentId: created.id } } });
      return created;
    });
    return this.response(attachment);
  }
  async download(workspaceId: string, attachmentId: string) {
    const attachment = await this.prisma.attachment.findFirst({ where: { id: attachmentId, workspaceId, archivedAt: null } });
    if (!attachment) throw new NotFoundException('Active attachment not found');
    return this.storage.createSignedDownload(attachment.storageKey, 300);
  }
  async remove(workspaceId: string, userId: string, attachmentId: string, context: AuthClientContext): Promise<void> {
    const attachment = await this.prisma.attachment.findFirst({ where: { id: attachmentId, workspaceId } });
    if (!attachment) throw new NotFoundException('Attachment not found');
    if (!attachment.archivedAt) await this.prisma.$transaction([
      this.prisma.attachment.update({ where: { id: attachmentId }, data: { archivedAt: new Date() } }),
      this.prisma.activityLog.create({ data: { workspaceId, actorId: userId, eventType: 'ATTACHMENT_DELETED', subjectType: 'TASK', subjectId: attachment.taskId, requestId: context.requestId, metadata: { attachmentId } } })
    ]);
    await this.storage.delete(attachment.storageKey);
  }
  async cleanupOrphans(workspaceId: string): Promise<number> {
    const prefix = `workspaces/${workspaceId}/attachments/`;
    const keys = await this.storage.list(prefix);
    const referenced = new Set((await this.prisma.attachment.findMany({ where: { workspaceId, archivedAt: null }, select: { storageKey: true } })).map(({ storageKey }) => storageKey));
    const orphaned = keys.filter((key) => !referenced.has(key));
    await Promise.all(orphaned.map((key) => this.storage.delete(key)));
    return orphaned.length;
  }
  private async assertTask(workspaceId: string, taskId: string) {
    if (!await this.prisma.task.findFirst({ where: { id: taskId, workspaceId, archivedAt: null }, select: { id: true } })) throw new NotFoundException('Active task not found');
  }
  private async assertWorkspaceAttachmentQuota(workspaceId: string, nextByteSize: number) {
    const { _sum } = await this.prisma.attachment.aggregate({ where: { workspaceId, archivedAt: null }, _sum: { byteSize: true } });
    const currentBytes = _sum.byteSize ?? 0n;
    if (currentBytes + BigInt(nextByteSize) > BigInt(MAX_WORKSPACE_ATTACHMENT_BYTES)) throw new BadRequestException('Workspace attachment storage quota exceeded');
  }
  private response(attachment: { id: string; taskId: string; fileName: string; mimeType: string; byteSize: bigint; createdAt: Date }) {
    return { id: attachment.id, taskId: attachment.taskId, fileName: attachment.fileName, mimeType: attachment.mimeType, byteSize: attachment.byteSize.toString(), createdAt: attachment.createdAt };
  }
}
