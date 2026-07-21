import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import type { AuthenticatedUser } from '../authorization/authenticated-user';
import { CurrentUser } from '../authorization/current-user.decorator';
import { CurrentWorkspaceId } from '../authorization/current-workspace.decorator';
import { RequireWorkspaceAccess } from '../authorization/workspace-access.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ArchiveDocumentRequestDto, CreateDocumentRequestDto, DocumentResponseDto, UpdateDocumentRequestDto } from './document.dto';
import { archiveDocumentSchema, createDocumentSchema, documentListSchema, type CreateDocumentInput, type DocumentListInput, type UpdateDocumentInput, updateDocumentSchema } from './document.schemas';
import { DocumentService } from './document.service';

const context = (request: Request) => ({ requestId: (request as Request & { requestId?: string }).requestId });

@RequireWorkspaceAccess()
@ApiTags('documents')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/documents')
export class DocumentController {
  constructor(@Inject(DocumentService) private readonly documents: DocumentService) {}

  @Get()
  @ApiQuery({ name: 'projectId', required: false, type: String })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  @ApiOkResponse({ type: [DocumentResponseDto] })
  list(@CurrentWorkspaceId() workspaceId: string, @Query(new ZodValidationPipe(documentListSchema)) query: DocumentListInput) {
    return this.documents.list(workspaceId, query);
  }

  @Get(':documentId')
  @ApiOkResponse({ type: DocumentResponseDto })
  get(@CurrentWorkspaceId() workspaceId: string, @Param('documentId') documentId: string) {
    return this.documents.get(workspaceId, documentId);
  }

  @Post()
  @ApiBody({ type: CreateDocumentRequestDto })
  @ApiCreatedResponse({ type: DocumentResponseDto })
  create(@CurrentWorkspaceId() workspaceId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createDocumentSchema)) input: CreateDocumentInput, @Req() request: Request) {
    return this.documents.create(workspaceId, user.id, input, context(request));
  }

  @Patch(':documentId')
  @ApiBody({ type: UpdateDocumentRequestDto })
  @ApiOkResponse({ type: DocumentResponseDto })
  update(@CurrentWorkspaceId() workspaceId: string, @Param('documentId') documentId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(updateDocumentSchema)) input: UpdateDocumentInput, @Req() request: Request) {
    return this.documents.update(workspaceId, documentId, user.id, input, context(request));
  }

  @Delete(':documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: ArchiveDocumentRequestDto })
  @ApiNoContentResponse()
  archive(@CurrentWorkspaceId() workspaceId: string, @Param('documentId') documentId: string, @CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(archiveDocumentSchema)) input: { contentVersion: number }, @Req() request: Request) {
    return this.documents.archive(workspaceId, documentId, user.id, input.contentVersion, context(request));
  }
}
