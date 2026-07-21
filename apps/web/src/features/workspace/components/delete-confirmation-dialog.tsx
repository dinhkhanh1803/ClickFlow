'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';

import { Dialog, DialogTitle } from '@/components/ui/dialog';

type DeleteConfirmationDialogProps = {
  open: boolean;
  title: string;
  itemName: string;
  description: string;
  pending?: boolean;
  confirmLabel?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export function DeleteConfirmationDialog({ open, title, itemName, description, pending = false, confirmLabel = 'Delete', onOpenChange, onConfirm }: DeleteConfirmationDialogProps) {
  const close = () => { if (!pending) onOpenChange(false); };

  return <Dialog open={open} onOpenChange={close} ariaLabel={`Delete ${itemName}`} contentClassName="max-w-lg overflow-hidden border border-slate-200/80 bg-white p-0 shadow-2xl shadow-slate-950/35 dark:border-slate-700 dark:bg-slate-950">
    <section>
      <header className="flex gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
          <Trash2 aria-hidden="true" size={21} />
        </span>
        <div className="min-w-0">
          <DialogTitle className="text-xl text-slate-950 dark:text-white">{title}</DialogTitle>
          <p className="mt-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{itemName}</p>
        </div>
      </header>
      <div className="space-y-4 px-6 py-5">
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
          <p className="text-xs leading-5">This action removes the item from active views. Archived data can only be recovered from archive tools.</p>
        </div>
      </div>
      <footer className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
        <button type="button" disabled={pending} onClick={close} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
        <button type="button" disabled={pending} onClick={() => void onConfirm()} className="inline-flex min-w-28 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
          <Trash2 aria-hidden="true" size={16} />{pending ? 'Deleting...' : confirmLabel}
        </button>
      </footer>
    </section>
  </Dialog>;
}
