'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import type { SpacePublicAccess } from './creation-dialog';

const icons = ['\u{1F680}', '\u{1F4C1}', '\u{1F3AF}', '\u{1F4A1}', '\u{1F4E3}', '\u{1F6E0}', '\u{1F31F}', '\u{1F3E2}'];
const tones = ['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-violet-500', 'bg-cyan-500', 'bg-slate-500'];

type SpaceSettingsDialogProps = {
  open: boolean;
  name: string;
  description: string;
  isPrivate: boolean;
  publicAccess: SpacePublicAccess;
  icon: string;
  tone: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPrivateChange: (value: boolean) => void;
  onPublicAccessChange: (value: SpacePublicAccess) => void;
  onIconChange: (value: string) => void;
  onToneChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function SpaceSettingsDialog({ open, name, description, icon, tone, pending, onOpenChange, onNameChange, onDescriptionChange, onIconChange, onToneChange, onSubmit }: SpaceSettingsDialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange} ariaLabel="Space settings">
    <form onSubmit={onSubmit} className="space-y-5"><div><DialogTitle>Space settings</DialogTitle><p className="mt-1 text-sm text-slate-500">Only the Space owner can change these settings.</p></div>
      <label className="block text-sm font-semibold">Name<input required aria-label="Space settings name" value={name} onChange={(event) => onNameChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-slate-700" /></label>
      <label className="block text-sm font-semibold">Description<textarea aria-label="Space settings description" value={description} onChange={(event) => onDescriptionChange(event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 dark:border-slate-700" /></label>
      <fieldset className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><legend className="px-1 text-sm font-semibold">Access</legend><p className="text-xs text-slate-500">Spaces are public to signed-in users and editable by default.</p><div className="flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">Public</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">Can edit</span></div></fieldset>
      <fieldset><legend className="text-sm font-semibold">Icon</legend><div className="mt-2 flex flex-wrap gap-2">{icons.map((item) => <button key={item} type="button" aria-label={`Space icon ${item}`} aria-pressed={icon === item} onClick={() => onIconChange(item)} className={`grid h-10 w-10 place-items-center rounded-lg border text-lg ${icon === item ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-slate-200 dark:border-slate-700'}`}>{item}</button>)}</div></fieldset>
      <fieldset><legend className="text-sm font-semibold">Color</legend><div className="mt-2 flex flex-wrap gap-2">{tones.map((item) => <button key={item} type="button" aria-label={`Space color ${item.replace('bg-', '')}`} aria-pressed={tone === item} onClick={() => onToneChange(item)} className={`h-8 w-8 rounded-full ${item} ${tone === item ? 'ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-slate-950' : ''}`} />)}</div></fieldset>
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={pending || !name.trim()}>{pending ? 'Saving...' : 'Save changes'}</Button></div>
    </form>
  </Dialog>;
}