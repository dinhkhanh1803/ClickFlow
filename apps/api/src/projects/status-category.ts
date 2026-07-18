import { StatusCategory as PrismaStatusCategory } from '@prisma/client';
import type { StatusCategory as ApiStatusCategory } from '@clickflow/contracts';

export function toPrismaStatusCategory(category: ApiStatusCategory): PrismaStatusCategory {
  if (category === 'IN_PROGRESS') return PrismaStatusCategory.ACTIVE;
  if (category === 'COMPLETED') return PrismaStatusCategory.DONE;
  return PrismaStatusCategory.NOT_STARTED;
}

export function toApiStatusCategory(category: PrismaStatusCategory): ApiStatusCategory {
  if (category === PrismaStatusCategory.ACTIVE) return 'IN_PROGRESS';
  if (category === PrismaStatusCategory.DONE || category === PrismaStatusCategory.CLOSED) return 'COMPLETED';
  return 'OPEN';
}
