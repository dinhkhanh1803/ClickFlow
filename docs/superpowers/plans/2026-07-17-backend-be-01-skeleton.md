# ClickFlow BE-01 Backend Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khởi tạo NestJS REST API tại `apps/api` với cấu hình môi trường an toàn, OpenAPI, health endpoint, validation, error envelope, request ID/logging và test harness.

**Architecture:** `apps/api` là NestJS application độc lập, gắn global prefix `/api/v1`. Bootstrap chỉ đăng ký cross-cutting concerns; `health` là module đầu tiên. Middleware tạo hoặc nhận `x-request-id`; exception filter chuẩn hóa mọi lỗi thành `{ code, message, details, requestId }` và logger chỉ log metadata an toàn.

**Tech Stack:** Node.js, pnpm workspace, NestJS, TypeScript strict, Jest/Supertest, `class-validator`, `class-transformer`, Swagger/OpenAPI, Zod.

---

## File structure

| File | Responsibility |
| --- | --- |
| `apps/api/package.json` | API dependencies and lifecycle scripts |
| `apps/api/src/main.ts` | Bootstrap, global API conventions, Swagger |
| `apps/api/src/app.module.ts` | Root module composition |
| `apps/api/src/config/*` | Typed, validated environment configuration |
| `apps/api/src/common/http/*` | Request ID, error envelope, exception filter |
| `apps/api/src/common/logging/*` | Structured safe application logger |
| `apps/api/src/health/*` | Public liveness endpoint and response contract |
| `apps/api/test/*` | E2E setup and health/error contract coverage |
| `apps/api/*.json` | Nest, TypeScript and Jest configuration |
| `.env.example` | Documented environment variables for API development |
| `package.json`, `turbo.json` | Root scripts and task orchestration |

### Task 1: Create the API package and verify its test runner

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/jest.config.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/test/app.e2e-spec.ts`
- Modify: `package.json`
- Modify: `turbo.json`

- [ ] **Step 1: Write the failing e2e test**

```ts
// apps/api/test/app.e2e-spec.ts
describe('API bootstrap', () => {
  it('starts an HTTP application for e2e tests', async () => {
    expect(true).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @clickflow/api test:e2e`

Expected: FAIL because the placeholder expectation receives `true`.

- [ ] **Step 3: Add the API package, tool configuration and a minimal Nest application**

```json
// apps/api/package.json
{
  "name": "@clickflow/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "lint": "eslint \"src/**/*.ts\" \"test/**/*.ts\"",
    "test": "jest --config jest.config.ts",
    "test:e2e": "jest --config jest.config.ts --runInBand",
    "typecheck": "tsc --noEmit"
  }
}
```

```ts
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';

@Module({})
export class AppModule {}
```

```ts
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
```

Configure `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json` and `jest.config.ts` to compile `src`, include `test/**/*.ts`, and resolve TypeScript source imports. Add root scripts `build`, `lint`, `test`, `test:e2e` and `typecheck` using Turbo; define matching Turbo tasks with `dependsOn: ["^build"]` for build and empty outputs for checks.

- [ ] **Step 4: Replace the placeholder with a real application bootstrap test**

```ts
// apps/api/test/app.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('API bootstrap', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('starts an HTTP application for e2e tests', () => {
    expect(app.getHttpServer()).toBeDefined();
  });
});
```

- [ ] **Step 5: Install dependencies and run the test**

Run: `pnpm add --filter @clickflow/api @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs && pnpm add --filter @clickflow/api -D @nestjs/cli @nestjs/schematics @nestjs/testing @types/express @types/jest @types/supertest eslint jest supertest ts-jest ts-node typescript`

Run: `pnpm --filter @clickflow/api test:e2e`

Expected: PASS with one bootstrap test.

- [ ] **Step 6: Commit**

```bash
git add package.json turbo.json pnpm-lock.yaml apps/api
git commit -m "feat(api): initialize NestJS application"
```

### Task 2: Add validated runtime configuration

**Files:**
- Create: `apps/api/src/config/config.module.ts`
- Create: `apps/api/src/config/env.schema.ts`
- Create: `apps/api/src/config/env.schema.spec.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `.env.example`

- [ ] **Step 1: Write a failing configuration test**

```ts
// apps/api/src/config/env.schema.spec.ts
import { parseEnvironment } from './env.schema';

describe('parseEnvironment', () => {
  it('rejects an invalid port', () => {
    expect(() => parseEnvironment({ NODE_ENV: 'test', PORT: 'not-a-number' })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @clickflow/api test -- env.schema.spec.ts`

Expected: FAIL because `parseEnvironment` does not exist.

- [ ] **Step 3: Implement minimal environment parsing and register it globally**

```ts
// apps/api/src/config/env.schema.ts
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(input: Record<string, unknown>): Environment {
  return environmentSchema.parse(input);
}
```

```ts
// apps/api/src/config/config.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { parseEnvironment } from './env.schema';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: parseEnvironment })],
})
export class AppConfigModule {}
```

Import `AppConfigModule` from `AppModule`, use `ConfigService` rather than direct environment access in `main.ts`, and revise `.env.example` to include only `NODE_ENV`, `PORT`, `CORS_ORIGIN`, `WEB_URL`, `API_URL`; leave future database/JWT/storage values documented but marked as unused until BE-02/BE-03.

- [ ] **Step 4: Run the focused test and typecheck**

Run: `pnpm --filter @clickflow/api test -- env.schema.spec.ts && pnpm --filter @clickflow/api typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .env.example apps/api/src/config apps/api/src/app.module.ts apps/api/src/main.ts pnpm-lock.yaml
git commit -m "feat(api): validate runtime environment"
```

### Task 3: Establish request correlation, structured logging and HTTP error contract

**Files:**
- Create: `apps/api/src/common/http/request-id.middleware.ts`
- Create: `apps/api/src/common/http/http-error.filter.ts`
- Create: `apps/api/src/common/http/http-error.filter.spec.ts`
- Create: `apps/api/src/common/logging/app-logger.service.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/test/app.e2e-spec.ts`

- [ ] **Step 1: Write a failing e2e test for the public error contract**

```ts
// add to apps/api/test/app.e2e-spec.ts
it('returns the documented error envelope with a request ID', async () => {
  const response = await request(app.getHttpServer()).get('/api/v1/not-found');

  expect(response.status).toBe(404);
  expect(response.headers['x-request-id']).toEqual(expect.any(String));
  expect(response.body).toMatchObject({
    code: 'NOT_FOUND',
    message: 'Resource not found',
    requestId: response.headers['x-request-id'],
  });
  expect(response.body).not.toHaveProperty('stack');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @clickflow/api test:e2e -- app.e2e-spec.ts`

Expected: FAIL because the app has no `/api/v1` prefix, request ID header or error envelope.

- [ ] **Step 3: Implement the minimum cross-cutting HTTP infrastructure**

```ts
// apps/api/src/common/http/request-id.middleware.ts
import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = request.header('x-request-id') ?? randomUUID();
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    next();
  }
}
```

```ts
// apps/api/src/common/http/http-error.filter.ts
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const body = {
      code: status === 404 ? 'NOT_FOUND' : status === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED',
      message: status === 404 ? 'Resource not found' : status === 500 ? 'Internal server error' : 'Request failed',
      details: undefined,
      requestId: request.requestId,
    };
    response.status(status).json(body);
  }
}
```

Register the middleware using `configure` on `AppModule`, call `app.setGlobalPrefix('api/v1')`, register `HttpErrorFilter` globally, and implement `AppLoggerService` as a `LoggerService` that writes JSON metadata `{ timestamp, level, message, requestId }` without headers, request bodies, passwords or tokens.

- [ ] **Step 4: Run the e2e test**

Run: `pnpm --filter @clickflow/api test:e2e -- app.e2e-spec.ts`

Expected: PASS; 404 output uses the documented envelope and carries the same request ID in header and body.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/common apps/api/src/app.module.ts apps/api/src/main.ts apps/api/test/app.e2e-spec.ts
git commit -m "feat(api): add request tracing and error contract"
```

### Task 4: Implement and document the health endpoint and OpenAPI

**Files:**
- Create: `apps/api/src/health/health.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/health/health.dto.ts`
- Create: `apps/api/src/health/health.controller.spec.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/test/app.e2e-spec.ts`
- Modify: `apps/api/README.md`

- [ ] **Step 1: Write a failing health controller unit test**

```ts
// apps/api/src/health/health.controller.spec.ts
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports the application as healthy', () => {
    expect(new HealthController().getHealth()).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @clickflow/api test -- health.controller.spec.ts`

Expected: FAIL because `HealthController` does not exist.

- [ ] **Step 3: Add the controller, DTO and module**

```ts
// apps/api/src/health/health.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';
}
```

```ts
// apps/api/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './health.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth(): HealthResponseDto {
    return { status: 'ok' };
  }
}
```

Import `HealthModule` into `AppModule`. In `main.ts`, create a Swagger document with `DocumentBuilder`, title `ClickFlow API`, version `v1`, bearer auth declaration for future protected endpoints, then serve UI at `/api/docs` and JSON at `/api/docs-json`.

- [ ] **Step 4: Add e2e coverage for the public contract**

```ts
it('returns the liveness status from GET /api/v1/health', async () => {
  await request(app.getHttpServer())
    .get('/api/v1/health')
    .expect(200)
    .expect({ status: 'ok' });
});
```

- [ ] **Step 5: Run the focused tests**

Run: `pnpm --filter @clickflow/api test -- health.controller.spec.ts && pnpm --filter @clickflow/api test:e2e -- app.e2e-spec.ts`

Expected: PASS.

- [ ] **Step 6: Document developer commands and commit**

Document prerequisites, environment setup, `pnpm --filter @clickflow/api start:dev`, test commands, `/api/v1/health`, `/api/docs`, and BE-01 boundary in `apps/api/README.md`.

```bash
git add apps/api/src/health apps/api/src/app.module.ts apps/api/src/main.ts apps/api/test apps/api/README.md pnpm-lock.yaml
git commit -m "feat(api): expose health endpoint and OpenAPI"
```

### Task 5: Configure request validation and verify workspace checks

**Files:**
- Create: `apps/api/src/common/http/validation-error.dto.ts`
- Modify: `apps/api/src/common/http/http-error.filter.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/test/app.e2e-spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Write a failing validation-contract e2e test**

Create a temporary test-only controller in `app.e2e-spec.ts` with `POST /api/v1/test-validation` and a DTO containing `@IsEmail() email: string`; import that testing module instead of `AppModule`. Assert the request `{ email: 'invalid' }` returns 400 with:

```ts
{
  code: 'VALIDATION_FAILED',
  message: 'Request validation failed',
  details: [{ field: 'email', message: expect.any(String) }],
  requestId: expect.any(String),
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @clickflow/api test:e2e -- app.e2e-spec.ts`

Expected: FAIL because no global `ValidationPipe` or validation error mapping exists.

- [ ] **Step 3: Add the minimal validation configuration**

Register a global `ValidationPipe` in `main.ts` with `transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`. Extend `HttpErrorFilter` to recognize `BadRequestException` validation errors and translate constraint entries into `{ field, message }` details while retaining the request ID. Add `class-validator` and `class-transformer` runtime dependencies.

- [ ] **Step 4: Run all BE-01 quality checks**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build`

Expected: every command exits 0; no TypeScript errors or test failures.

- [ ] **Step 5: Commit**

```bash
git add package.json turbo.json pnpm-lock.yaml apps/api
git commit -m "feat(api): validate request payloads globally"
```

### Task 6: Final documentation and phase-boundary verification

**Files:**
- Modify: `README.md`
- Modify: `apps/api/README.md`
- Modify: `docs/backend/2026-07-17-backend-phases.md`

- [ ] **Step 1: Add a failing documentation smoke assertion**

Create `apps/api/test/documentation.spec.ts` that reads `apps/api/README.md` and asserts it contains `pnpm --filter @clickflow/api start:dev`, `/api/v1/health`, and `/api/docs`.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @clickflow/api test -- documentation.spec.ts`

Expected: FAIL until the API README describes the commands and endpoints.

- [ ] **Step 3: Complete the docs and BE-01 checklist**

Add a root README note linking the API getting-started guide. In the API README, document setup, config, commands, endpoints, error envelope and explicitly state that BE-01 does not configure database or authentication. In backend phases, mark BE-01 complete only after all verification commands pass.

- [ ] **Step 4: Run final verification**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build`

Expected: all checks PASS.

- [ ] **Step 5: Commit**

```bash
git add README.md apps/api/README.md apps/api/test/documentation.spec.ts docs/backend/2026-07-17-backend-phases.md
git commit -m "docs(api): document backend skeleton"
```

## Plan self-review

- Spec coverage: Tasks 1–6 cover every BE-01 deliverable: NestJS scaffold, scripts, env validation, `/api/v1`, health, Swagger, validation, error envelope, request ID, logging, unit/e2e test harness and documentation.
- Scope: no Prisma, PostgreSQL, authentication, resource endpoint or deployment work appears in implementation tasks.
- Consistency: health is exposed at `/api/v1/health`; OpenAPI UI and JSON remain `/api/docs` and `/api/docs-json` by deliberate convention; all external errors carry `requestId`.
- Placeholders: none; version selections are left to the package manager's current compatible releases at install time.
