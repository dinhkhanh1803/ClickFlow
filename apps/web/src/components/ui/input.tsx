import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('flex h-10 w-full rounded-lg border border-white/60 bg-white/45 px-3 py-2 text-sm shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-950/35 outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />
  ),
);
Input.displayName = 'Input';