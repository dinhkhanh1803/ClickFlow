import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import type { PrismaService } from '../src/database/prisma.service';

type RegisterVerifiedInput = { email: string; displayName: string; password: string };

export async function registerVerifiedUser(app: INestApplication, prisma: PrismaService, input: RegisterVerifiedInput) {
  await request(app.getHttpServer()).post('/api/v1/auth/register-email').send(input).expect(201);
  const user = await prisma.user.update({
    where: { email: input.email },
    data: { emailVerifiedAt: new Date() },
    select: { id: true, email: true, displayName: true }
  });
  const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
    email: input.email,
    password: input.password
  }).expect(200);
  const accessToken = String(login.body.accessToken);
  const workspaces = await request(app.getHttpServer()).get('/api/v1/workspaces')
    .set('Authorization', 'Bearer ' + accessToken)
    .expect(200);
  const workspaceId = String(workspaces.body[0]?.id ?? '');
  return {
    accessToken,
    userId: user.id,
    user,
    workspaceId,
    headers: { Authorization: 'Bearer ' + accessToken }
  };
}
