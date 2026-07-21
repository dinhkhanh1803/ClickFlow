'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  contentClassName?: string;
  ariaLabel?: string;
};

export function Dialog({ open, onOpenChange, children, contentClassName, ariaLabel }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onOpenChange(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onOpenChange, open]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(<div className="fixed inset-0 z-[100] grid place-items-center p-4" role="presentation"><button aria-label="Close dialog" className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-[2px]" onClick={() => onOpenChange(false)} /><div role="dialog" aria-modal="true" aria-label={ariaLabel} className={cn('relative w-full max-w-md glass-surface rounded-2xl p-6', contentClassName)}>{children}</div></div>, document.body);
}

export function DialogTitle({ className, ...props }: React.ComponentProps<'h2'>) { return <h2 className={cn('text-lg font-semibold', className)} {...props} />; }