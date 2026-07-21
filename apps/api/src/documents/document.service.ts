import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { AuthClientContext } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import type { CreateDocumentInput, DocumentListInput, UpdateDocumentInput } from './document.schemas';

@Injectable()
export class DocumentService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  list(workspaceId: string, query: DocumentListInput) {
    return this.prisma.document.findMany({
      where: {
        workspaceId,
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.includeArchived ? {} : { archivedAt: null })
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }]
    });
  }

  async get(workspaceId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({ where: { id: documentId, workspaceId } });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async create(workspaceId: string, actorId: string, input: CreateDocumentInput, context: AuthClientContext) {
    await this.assertParents(workspaceId, input.projectId ?? null, input.sectionId ?? null);
    return this.prisma.$transaction(async (transaction) => {
      const document = await transaction.document.create({
        data: {
          workspaceId,
          title: input.title,
          content: input.content,
          projectId: input.projectId ?? null,
          sectionId: input.sectionId ?? null
        }
      });
      await transaction.activityLog.create({ data: { workspaceId, actorId, eventType: 'DOCUMENT_CREATED', subjectType: 'DOCUMENT', subjectId: document.id, requestId: context.requestId } });
      return document;
    });
  }

  async update(workspaceId: string, documentId: string, actorId: string, input: UpdateDocumentInput, context: AuthClientContext) {
    return this.prisma.$transaction(async (transaction) => {
      const changed = await transaction.document.updateMany({
        where: { id: documentId, workspaceId, archivedAt: null, contentVersion: input.contentVersion },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.content !== undefined ? { content: input.content } : {}),
          contentVersion: { increment: 1 }
        }
      });
      if (!changed.count) {
        const exists = await transaction.document.findFirst({ where: { id: documentId, workspaceId, archivedAt: null }, select: { id: true } });
        if (!exists) throw new NotFoundException('Active document not found');
        throw new ConflictException('Document version is stale');
      }
      const document = await transaction.document.findUniqueOrThrow({ where: { id: documentId } });
      await transaction.activityLog.create({ data: { workspaceId, actorId, eventType: 'DOCUMENT_UPDATED', subjectType: 'DOCUMENT', subjectId: documentId, requestId: context.requestId, metadata: { contentVersion: document.contentVersion } } });
      return document;
    });
  }

  async archive(workspaceId: string, documentId: string, actorId: string, contentVersion: number, context: AuthClientContext): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const changed = await transaction.document.updateMany({ where: { id: documentId, workspaceId, archivedAt: null, contentVersion }, data: { archivedAt: new Date(), contentVersion: { increment: 1 } } });
      if (!changed.count) {
        const exists = await transaction.document.findFirst({ where: { id: documentId, workspaceId, archivedAt: null }, select: { id: true } });
        if (!exists) throw new NotFoundException('Active document not found');
        throw new ConflictException('Document version is stale');
      }
      await transaction.activityLog.create({ data: { workspaceId, actorId, eventType: 'DOCUMENT_ARCHIVED', subjectType: 'DOCUMENT', subjectId: documentId, requestId: context.requestId } });
    });
  }

  private async assertParents(workspaceId: string, projectId: string | null, sectionId: string | null) {
    if (projectId && !await this.prisma.project.findFirst({ where: { id: projectId, workspaceId, archivedAt: null }, select: { id: true } })) throw new NotFoundException('Active parent Project not found');
    if (sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: sectionId, workspaceId, archivedAt: null }, select: { projectId: true } });
      if (!section) throw new NotFoundException('Active parent Section not found');
      if (projectId && section.projectId !== projectId) throw new ConflictException('Section does not belong to the selected Project');
    }
  }
}
