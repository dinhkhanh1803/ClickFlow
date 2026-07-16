'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  contentClassName?: string;
};

export function Dialog({ open, onOpenChange, children, contentClassName }: DialogProps) {
  React.useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onOpenChange(false); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onOpenChange]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] grid place-items-center p-4" role="presentation"><button aria-label="Close dialog" className="absolute inset-0 cursor-default bg-slate-950/30" onClick={() => onOpenChange(false)} /><div role="dialog" aria-modal="true" className={cn('relative w-full max-w-md glass-surface rounded-2xl p-6', contentClassName)}>{children}</div></div>;
}

export function DialogTitle({ className, ...props }: React.ComponentProps<'h2'>) { return <h2 className={cn('text-lg font-semibold', className)} {...props} />; }