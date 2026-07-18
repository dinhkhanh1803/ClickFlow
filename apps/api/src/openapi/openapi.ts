import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

const openApiConfiguration = new DocumentBuilder()
  .setTitle('ClickFlow API')
  .setDescription('Versioned REST API for ClickFlow workspaces and projects.')
  .setVersion('1.0.0')
  .addBearerAuth()
  .build();

function addLockedDomainContract(document: OpenAPIObject): OpenAPIObject {
  document.components ??= {};
  document.components.schemas = {
    ...document.components.schemas,
    MemberSummary: {
      type: 'object',
      required: ['id', 'displayName', 'initials', 'avatarUrl'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        displayName: { type: 'string' },
        initials: { type: 'string' },
        avatarUrl: { type: 'string', format: 'uri', nullable: true }
      }
    },
    StatusDefinition: {
      type: 'object',
      required: ['id', 'key', 'name', 'color', 'category', 'scopeType', 'scopeId', 'position'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        key: { type: 'string' },
        name: { type: 'string' },
        color: { type: 'string' },
        category: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED'] },
        scopeType: { type: 'string', enum: ['WORKSPACE', 'PROJECT', 'SECTION'] },
        scopeId: { type: 'string', format: 'uuid' },
        position: { type: 'integer', minimum: 0 }
      }
    },
    CreateTaskRequest: {
      type: 'object',
      required: ['sectionId', 'title', 'description', 'statusId', 'priority', 'assigneeId', 'startDate', 'dueDate'],
      properties: {
        sectionId: { type: 'string', format: 'uuid' },
        title: { type: 'string', minLength: 1, maxLength: 240 },
        description: { type: 'string', maxLength: 20000 },
        statusId: { type: 'string', format: 'uuid' },
        priority: { type: 'string', enum: ['URGENT', 'HIGH', 'NORMAL', 'LOW'] },
        assigneeId: { type: 'string', format: 'uuid', nullable: true },
        startDate: { type: 'string', format: 'date', nullable: true },
        dueDate: { type: 'string', format: 'date', nullable: true }
      }
    },
    TaskResponse: {
      type: 'object',
      required: ['id', 'workspaceId', 'projectId', 'sectionId', 'title', 'description', 'status', 'priority', 'assigneeId', 'assignee', 'startDate', 'dueDate', 'createdAt', 'updatedAt'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        workspaceId: { type: 'string', format: 'uuid' },
        projectId: { type: 'string', format: 'uuid' },
        sectionId: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        description: { type: 'string' },
        status: { $ref: '#/components/schemas/StatusDefinition' },
        priority: { type: 'string', enum: ['URGENT', 'HIGH', 'NORMAL', 'LOW'] },
        assigneeId: { type: 'string', format: 'uuid', nullable: true },
        assignee: { allOf: [{ $ref: '#/components/schemas/MemberSummary' }], nullable: true },
        startDate: { type: 'string', format: 'date', nullable: true },
        dueDate: { type: 'string', format: 'date', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    },
    WorkspaceTreeResponse: {
      type: 'object',
      required: ['workspace', 'nodes'],
      properties: {
        workspace: {
          type: 'object',
          required: ['id', 'name', 'tone', 'isPrivate', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            tone: { type: 'string' },
            isPrivate: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'kind', 'name', 'parentId', 'position', 'children'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              kind: { type: 'string', enum: ['PROJECT', 'SECTION', 'DOCUMENT', 'NAVIGATION_ITEM'] },
              name: { type: 'string' },
              parentId: { type: 'string', format: 'uuid', nullable: true },
              position: { type: 'integer', minimum: 0 },
              navigationKind: { type: 'string', enum: ['DASHBOARD', 'WHITEBOARD', 'FORM'] },
              children: { type: 'array', items: { type: 'object', additionalProperties: true } }
            }
          }
        }
      }
    }
  };

  document.components.examples = {
    WorkspaceTreeResponse: {
      summary: 'Space UI mapped to a Workspace API tree',
      value: {
        workspace: {
          id: '10000000-0000-4000-8000-000000000001',
          name: 'ClickFlow Product',
          tone: 'indigo',
          isPrivate: true,
          createdAt: '2026-07-18T00:00:00.000Z',
          updatedAt: '2026-07-18T00:00:00.000Z'
        },
        nodes: [{
          id: '20000000-0000-4000-8000-000000000001',
          kind: 'PROJECT',
          name: 'Projects',
          parentId: null,
          position: 0,
          children: [{
            id: '30000000-0000-4000-8000-000000000001',
            kind: 'SECTION',
            name: 'Roadmap',
            parentId: '20000000-0000-4000-8000-000000000001',
            position: 0,
            children: []
          }]
        }]
      }
    },
    CreateTaskRequest: {
      summary: 'Task mutation uses IDs and canonical enums',
      value: {
        sectionId: '30000000-0000-4000-8000-000000000001',
        title: 'Draft launch brief',
        description: 'Prepare the first reviewable launch brief.',
        statusId: '40000000-0000-4000-8000-000000000001',
        priority: 'HIGH',
        assigneeId: '50000000-0000-4000-8000-000000000001',
        startDate: '2026-07-18',
        dueDate: '2026-07-21'
      }
    },
    TaskResponse: {
      summary: 'Task response includes member summary and UTC timestamps',
      value: {
        id: '60000000-0000-4000-8000-000000000001',
        workspaceId: '10000000-0000-4000-8000-000000000001',
        projectId: '20000000-0000-4000-8000-000000000001',
        sectionId: '30000000-0000-4000-8000-000000000001',
        title: 'Draft launch brief',
        description: 'Prepare the first reviewable launch brief.',
        status: {
          id: '40000000-0000-4000-8000-000000000001',
          key: 'in-progress',
          name: 'In progress',
          color: 'blue',
          category: 'IN_PROGRESS',
          scopeType: 'SECTION',
          scopeId: '30000000-0000-4000-8000-000000000001',
          position: 1
        },
        priority: 'HIGH',
        assigneeId: '50000000-0000-4000-8000-000000000001',
        assignee: { id: '50000000-0000-4000-8000-000000000001', displayName: 'Khanh Tran', initials: 'KT', avatarUrl: null },
        startDate: '2026-07-18',
        dueDate: '2026-07-21',
        createdAt: '2026-07-18T00:00:00.000Z',
        updatedAt: '2026-07-18T00:00:00.000Z'
      }
    }
  };

  return document;
}

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const document = SwaggerModule.createDocument(app, openApiConfiguration, {
    operationIdFactory: (controllerKey, methodKey) => `${controllerKey}_${methodKey}`
  });
  return addLockedDomainContract(document);
}

export function setupOpenApi(app: INestApplication): void {
  SwaggerModule.setup('api/docs', app, createOpenApiDocument(app), {
    jsonDocumentUrl: 'api/docs/openapi.json'
  });
}
