import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, Resolver } from 'react-hook-form';
import type { ZodType } from 'zod';

/**
 * Isolates the resolver package's narrower Zod 4 minor-version typings.
 * Runtime validation still delegates to the official Zod resolver.
 */
export function zodFormResolver<TValues extends FieldValues>(schema: ZodType<TValues>): Resolver<TValues> {
  return zodResolver(schema as never) as Resolver<TValues>;
}
