'use client';

import { FileText, Folder, Globe2, ListChecks, LockKeyhole, PanelTop, Pencil, UserPlus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle } from '@/components/ui/dialog';

export type CreationDialogKind = 'space' | 'folder' | 'list' | 'doc';
export type SpacePublicAccess = 'VIEW' | 'EDIT';

type CreationDialogProps = {
  kind: CreationDialogKind;
  open: boolean;
  name: string;
  description: string;
  isPrivate: boolean;
  publicAccess: SpacePublicAccess;
  invitees: string;
  pending?: boolean;
  parentLabel?: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPrivateChange: (value: boolean) => void;
  onPublicAccessChange: (value: SpacePublicAccess) => void;
  onInviteesChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const copy = {
  space: { title: 'Create Space', subtitle: 'Bring related projects, Lists, Docs, and people together.', placeholder: 'e.g. Product, Marketing, Operations', icon: PanelTop },
  folder: { title: 'Create Folder', subtitle: 'Use Folders to organize your Lists, Docs, and more.', placeholder: 'e.g. Project, Client, Team', icon: Folder },
  list: { title: 'Create List', subtitle: 'Create a focused place to plan tasks and track delivery.', placeholder: 'e.g. Sprint backlog, Launch plan', icon: ListChecks },
  doc: { title: 'Create Doc', subtitle: 'Capture plans, decisions, and shared knowledge.', placeholder: 'e.g. Project brief, Meeting notes', icon: FileText },
} as const;

export function CreationDialog(props: CreationDialogProps) {
  const config = copy[props.kind];
  const Icon = config.icon;
  const isSpace = props.kind === 'space';
  const descriptionLabel = config.title.replace('Create ', '') + ' description';

  return <Dialog open={props.open} onOpenChange={props.onOpenChange} ariaLabel={config.title} contentClassName="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto border border-slate-200/80 bg-white p-0 shadow-2xl shadow-slate-950/35 dark:border-slate-700 dark:bg-slate-950">
    <form onSubmit={props.onSubmit}>
      <header className="flex items-start justify-between gap-5 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
        <div className="flex min-w-0 gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"><Icon size={20} /></span><div><DialogTitle className="text-xl">{config.title}</DialogTitle><p className="mt-1 text-sm text-slate-500">{config.subtitle}</p></div></div>
        <button type="button" aria-label={"Close " + config.title} onClick={() => props.onOpenChange(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"><X size={17} /></button>
      </header>
      <div className="space-y-5 px-6 py-5">
        {props.parentLabel && <p className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">Creating in <strong>{props.parentLabel}</strong></p>}
        <label className="block text-sm font-semibold">Name<input autoFocus required aria-label={isSpace ? 'Space name' : props.kind + ' name'} value={props.name} onChange={(event) => props.onNameChange(event.target.value)} placeholder={config.placeholder} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900" /></label>
        <label className="block text-sm font-semibold">Description <span className="font-normal text-slate-400">(optional)</span><textarea aria-label={descriptionLabel} value={props.description} onChange={(event) => props.onDescriptionChange(event.target.value)} placeholder={"Tell your team what this " + props.kind + " is for"} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900" /></label>
        {isSpace && <section aria-labelledby="space-access-title" className="space-y-3"><div><h3 id="space-access-title" className="text-sm font-semibold">Access</h3><p className="mt-1 text-xs text-slate-500">Choose who can discover and open this Space.</p></div><div className="grid gap-3 sm:grid-cols-2">
          <button type="button" aria-pressed={!props.isPrivate} onClick={() => props.onPrivateChange(false)} className={"flex items-start gap-3 rounded-xl border p-4 text-left transition " + (!props.isPrivate ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/10 dark:bg-indigo-950/30' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700')}><Globe2 className={!props.isPrivate ? 'text-indigo-600' : 'text-slate-400'} size={19} /><span><span className="block text-sm font-semibold">Public</span><span className="mt-1 block text-xs text-slate-500">Anyone signed in can find this Space.</span></span></button>
          <button type="button" aria-pressed={props.isPrivate} onClick={() => props.onPrivateChange(true)} className={"flex items-start gap-3 rounded-xl border p-4 text-left transition " + (props.isPrivate ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/10 dark:bg-indigo-950/30' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700')}><LockKeyhole className={props.isPrivate ? 'text-indigo-600' : 'text-slate-400'} size={19} /><span><span className="block text-sm font-semibold">Private</span><span className="mt-1 block text-xs text-slate-500">Only you and invited members can access it.</span></span></button>
        </div></section>}
        {isSpace && !props.isPrivate && <section aria-labelledby="space-public-permissions" className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div><h3 id="space-public-permissions" className="text-sm font-semibold">Public permissions</h3><p className="mt-1 text-xs text-slate-500">Only the Space owner can change what non-members can do.</p></div><div className="grid gap-3 sm:grid-cols-2">
          <button type="button" aria-pressed={props.publicAccess === 'VIEW'} onClick={() => props.onPublicAccessChange('VIEW')} className={"flex items-start gap-3 rounded-xl border p-3 text-left transition " + (props.publicAccess === 'VIEW' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-200' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700')}><Globe2 size={18} /><span><span className="block text-sm font-semibold">View only</span><span className="mt-1 block text-xs text-slate-500">Others can view this public Space.</span></span></button>
          <button type="button" aria-pressed={props.publicAccess === 'EDIT'} onClick={() => props.onPublicAccessChange('EDIT')} className={"flex items-start gap-3 rounded-xl border p-3 text-left transition " + (props.publicAccess === 'EDIT' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-200' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700')}><Pencil size={18} /><span><span className="block text-sm font-semibold">Can edit</span><span className="mt-1 block text-xs text-slate-500">Others can create and update Space content.</span></span></button>
        </div></section>}
        {isSpace && props.isPrivate && <label className="block rounded-xl border border-slate-200 p-4 dark:border-slate-700"><span className="flex items-center gap-2 text-sm font-semibold"><UserPlus size={17} className="text-indigo-500" />Invite people</span><span className="mt-1 block text-xs text-slate-500">Enter one or more emails separated by commas. Invitations require the upcoming member invitation API.</span><input aria-label="Invite people by email" value={props.invitees} onChange={(event) => props.onInviteesChange(event.target.value)} placeholder="name@company.com, teammate@company.com" className="mt-3 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-700" /></label>}
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60"><p className="hidden text-xs text-slate-500 sm:block">{isSpace && props.isPrivate ? 'Private Spaces are visible only to approved members.' : 'You can change these settings later.'}</p><div className="ml-auto flex gap-2"><Button type="button" variant="ghost" onClick={() => props.onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={props.pending || !props.name.trim()}>{props.pending ? 'Creating...' : isSpace ? 'Create Space' : 'Create'}</Button></div></footer>
    </form>
  </Dialog>;
}



