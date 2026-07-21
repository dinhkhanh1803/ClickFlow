import { BadRequestException, ConflictException, ForbiddenException, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { mapException } from './http-exception.filter';

describe('mapException', () => {
  it.each([
    [new BadRequestException(['title must not be empty']), 400, 'VALIDATION_ERROR'],
    [new UnauthorizedException(), 401, 'UNAUTHORIZED'],
    [new ForbiddenException(), 403, 'FORBIDDEN'],
    [new NotFoundException(), 404, 'NOT_FOUND'],
    [new ConflictException(), 409, 'CONFLICT']
  ])('maps known HTTP errors', (exception, status, code) => {
    expect(mapException(exception)).toMatchObject({ status, code });
  });

  it('maps Prisma unique and missing-record failures without exposing internals', () => {
    expect(mapException({ code: 'P2002', message: 'raw database detail' })).toEqual({
      status: 409,
      code: 'CONFLICT',
      message: 'Resource already exists',
      details: undefined
    });
    expect(mapException({ code: 'P2025', message: 'raw database detail' })).toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('hides unexpected and explicit HTTP 5xx messages', () => {
    expect(mapException(new InternalServerErrorException(['database password leaked']))).toMatchObject({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: undefined
    });
    expect(mapException(new Error('database password leaked'))).toEqual({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: undefined
    });
  });
});
