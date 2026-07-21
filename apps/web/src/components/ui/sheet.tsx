'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Sheet({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 md:hidden" role="presentation"><button aria-label="Close navigation" className="absolute inset-0 bg-slate-950/40" onClick={() => onOpenChange(false)} /><aside aria-label="Mobile navigation" className="relative h-full w-72 bg-white p-4 shadow-2xl dark:bg-slate-900">{children}</aside></div>;
}
export function SheetTitle({ className, ...props }: React.ComponentProps<'h2'>) { return <h2 className={cn('text-lg font-semibold', className)} {...props} />; }