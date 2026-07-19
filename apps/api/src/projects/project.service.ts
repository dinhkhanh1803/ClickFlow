import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatusCategory, StatusScopeType } from '@prisma/client';

import { buildPaginationQuery } from '../common/pagination';
import { PrismaService } from '../database/prisma.service';
import type { AuthClientContext } from '../auth/auth.service';
import type { CreateProjectInput, ProjectListInput, UpdateProjectInput } from './project.schemas';
import { ProjectHealthService } from './project-health.service';

const projectSelect = {
  id: true,
  workspaceId: true,
  name: true,
  description: true,
  tone: true,
  position: true,
  deadline: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true
} as const;

@Injectable()
export class ProjectService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ProjectHealthService) private readonly health: ProjectHealthService
  ) {}

  async list(workspaceId: string, query: ProjectListInput) {
    const pagination = buildPaginationQuery(query, ['updatedAt', 'createdAt', 'deadline', 'name'] as const);
    const where: Prisma.ProjectWhereInput = {
      workspaceId,
      parentId: null,
      archivedAt: query.archived === 'all' ? undefined : query.archived === 'archived' ? { not: null } : null,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {})
    };
    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: pagination.orderBy as Prisma.ProjectOrderByWithRelationInput[],
        select: projectSelect
      }),
      this.prisma.project.count({ where })
    ]);
    const items = await Promise.all(projects.map(async (project) => ({
      ...project,
      health: await this.health.getForProject(workspaceId, project.id, project.deadline)
    })));
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async get(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, workspaceId }, select: projectSelect });
    if (!project) throw new NotFoundException('Project not found');
    return { ...project, health: await this.health.getForProject(workspaceId, project.id, project.deadline) };
  }

  async create(workspaceId: string, actorId: string, input: CreateProjectInput, context: AuthClientContext) {
    const project = await this.prisma.$transaction(async (transaction) => {
      const maximum = await transaction.project.aggregate({
        where: { workspaceId, parentId: null },
        _max: { position: true }
      });
      const created = await transaction.project.create({
        data: {
          workspaceId,
          name: input.name,
          description: input.description,
          tone: input.tone,
          deadline: input.deadline,
          position: (maximum._max.position ?? -1) + 1
        },
        select: projectSelect
      });
      await transaction.taskStatus.createMany({
        data: [
          {
            workspaceId,
            projectId: created.id,
            scopeType: StatusScopeType.PROJECT,
            scopeId: created.id,
            name: 'Open',
            color: '#64748b',
            category: StatusCategory.NOT_STARTED,
            completed: false,
            position: 0
          },
          {
            workspaceId,
            projectId: created.id,
            scopeType: StatusScopeType.PROJECT,
            scopeId: created.id,
            name: 'In progress',
            color: '#3b82f6',
            category: StatusCategory.ACTIVE,
            completed: false,
            position: 1
          },
          {
            workspaceId,
            projectId: created.id,
            scopeType: StatusScopeType.PROJECT,
            scopeId: created.id,
            name: 'Complete',
            color: '#10b981',
            category: StatusCategory.CLOSED,
            completed: true,
            position: 2
          }
        ]
      });
      await this.recordActivity(transaction, workspaceId, actorId, 'PROJECT_CREATED', created.id, context.requestId);
      return created;
    });
    return { ...project, health: await this.health.getForProject(workspaceId, project.id, project.deadline) };
  }

  async update(workspaceId: string, projectId: string, actorId: string, input: UpdateProjectInput, context: AuthClientContext) {
    const project = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.project.updateMany({
        where: { id: projectId, workspaceId, archivedAt: null },
        data: input
      });
      if (updated.count !== 1) throw new NotFoundException('Project not found');
      await this.recordActivity(transaction, workspaceId, actorId, 'PROJECT_UPDATED', projectId, context.requestId);
      return transaction.project.findUniqueOrThrow({ where: { id: projectId }, select: projectSelect });
    });
    return { ...project, health: await this.health.getForProject(workspaceId, project.id, project.deadline) };
  }

  async archive(workspaceId: string, projectId: string, actorId: string, context: AuthClientContext): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const archived = await transaction.project.updateMany({
        where: { id: projectId, workspaceId, archivedAt: null },
        data: { archivedAt: new Date() }
      });
      if (archived.count !== 1) throw new NotFoundException('Active project not found');
      await this.recordActivity(transaction, workspaceId, actorId, 'PROJECT_ARCHIVED', projectId, context.requestId);
    });
  }

  private recordActivity(
    transaction: Prisma.TransactionClient,
    workspaceId: string,
    actorId: string,
    eventType: string,
    projectId: string,
    requestId?: string
  ) {
    return transaction.activityLog.create({
      data: {
        workspaceId,
        actorId,
        eventType,
        subjectType: 'PROJECT',
        subjectId: projectId,
        requestId
      }
    });
  }
}
