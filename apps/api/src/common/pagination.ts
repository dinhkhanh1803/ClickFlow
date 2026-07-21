import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const MAX_PAGE_SIZE = 100;

export class FilterQueryDto {
  @IsString()
  @IsOptional()
  filterBy?: string;

  @IsString()
  @IsOptional()
  filterValue?: string;
}

export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  @IsOptional()
  pageSize = 20;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'asc';
}

export function buildPaginationQuery<const Field extends string>(
  query: Partial<PaginationQueryDto>,
  allowedSortFields: readonly Field[]
): { skip: number; take: number; orderBy: Array<Record<string, 'asc' | 'desc'>> } {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const take = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(query.pageSize ?? 20)));
  const sortBy = query.sortBy ?? allowedSortFields[0];
  if (!sortBy || !allowedSortFields.includes(sortBy as Field)) throw new BadRequestException('Unsupported sort field');
  const direction = query.sortOrder ?? 'asc';
  const orderBy: Array<Record<string, 'asc' | 'desc'>> = [{ [sortBy]: direction }];
  if (sortBy !== 'id') orderBy.push({ id: 'asc' });
  return { skip: (page - 1) * take, take, orderBy };
}

export function buildAllowedFilter<const Field extends string>(
  query: Partial<FilterQueryDto>,
  allowedFilterFields: readonly Field[]
): Partial<Record<Field, string>> {
  if (query.filterBy === undefined && query.filterValue === undefined) return {};
  if (!query.filterBy || query.filterValue === undefined || !allowedFilterFields.includes(query.filterBy as Field)) {
    throw new BadRequestException('Unsupported filter field');
  }
  return { [query.filterBy]: query.filterValue } as Partial<Record<Field, string>>;
}
