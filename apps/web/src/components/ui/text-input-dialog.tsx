'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle } from '@/components/ui/dialog';

type TextInputDialogProps = {
  open: boolean;
  title: string;
  label: string;
  value: string;
  placeholder?: string;
  submitLabel?: string;
  pending?: boolean;
  onValueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export function TextInputDialog({ open, title, label, value, placeholder, submitLabel = 'Save', pending = false, onValueChange, onOpenChange, onSubmit }: TextInputDialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange} ariaLabel={title}>
    <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <DialogTitle>{title}</DialogTitle>
      <label className="block text-sm font-medium">{label}<input autoFocus aria-label={label} value={value} placeholder={placeholder} onChange={(event) => onValueChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700" /></label>
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={pending || !value.trim()}>{pending ? 'Saving...' : submitLabel}</Button></div>
    </form>
  </Dialog>;
}
