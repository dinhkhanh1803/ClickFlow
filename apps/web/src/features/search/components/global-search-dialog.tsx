'use client';

import { useContext, useMemo, useState } from 'react';
import Link from 'next/link';
import { QueryClient, QueryClientContext, useQuery } from '@tanstack/react-query';
import { CheckSquare2, Folder, Search, X } from 'lucide-react';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { analyticsApi } from '@/features/analytics/data/analytics-api';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';

type SearchFilter = 'all' | 'projects' | 'tasks' | 'docs';
const filters: Array<{ id: SearchFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'projects', label: 'Projects' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'docs', label: 'Docs' },
];

type GlobalSearchDialogProps = { open: boolean; onOpenChange: (open: boolean) => void };
const fallbackQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });


export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const token = useAuthStore((state) => state.accessToken);
  const navigation = useWorkspaceNavigationQuery();
  const workspace = navigation.data?.[0];
  const queryClient = useContext(QueryClientContext) ?? fallbackQueryClient;
  const search = useQuery({
    queryKey: ['analytics-search', workspace?.id, query],
    queryFn: () => analyticsApi.search(token!, workspace!.id, query.trim()),
    enabled: open && Boolean(token && workspace && query.trim().length >= 2),
  }, queryClient);
  const results = useMemo(() => (search.data?.items ?? [])
    .filter((item) => filter === 'all' || filter === 'projects' && item.type === 'PROJECT' || filter === 'tasks' && item.type === 'TASK')
    .map((item) => ({
      id: item.id,
      kind: item.type === 'PROJECT' ? 'project' : 'task',
      label: item.title,
      context: item.type === 'PROJECT' ? 'Project' : 'Task',
      href: item.type === 'PROJECT'
        ? '/projects?space=' + (workspace?.id ?? '') + '&folder=' + item.id
        : '/projects?space=' + (workspace?.id ?? '') + '&folder=' + (item.projectId ?? ''),
    })), [filter, search.data?.items, workspace?.id]);

  return <Dialog open={open} onOpenChange={onOpenChange} ariaLabel="Search ClickFlow" contentClassName="max-w-3xl overflow-hidden p-0 shadow-2xl shadow-slate-950/35">
    <div className="border-b border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-center gap-3"><Search aria-hidden="true" size={20} className="text-slate-400" /><label className="sr-only" htmlFor="global-search-query">Search ClickFlow</label><input id="global-search-query" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects and tasks..." className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400" /><button type="button" aria-label="Close search" onClick={() => onOpenChange(false)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"><X size={17} /></button></div>
      <div role="tablist" aria-label="Search categories" className="mt-4 flex flex-wrap gap-2">{filters.map((item) => <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === item.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>{item.label}</button>)}</div>
    </div>
    <div className="max-h-[min(60vh,32rem)] overflow-y-auto p-2"><DialogTitle className="sr-only">Search ClickFlow</DialogTitle>{query.trim().length < 2 ? <p className="px-3 py-12 text-center text-sm text-slate-500">Enter at least two characters to search projects and tasks.</p> : search.isLoading ? <p className="px-3 py-12 text-center text-sm text-slate-500">Searching...</p> : results.length === 0 ? <p className="px-3 py-12 text-center text-sm text-slate-500">No matching ClickFlow items.</p> : <ul aria-label="Search results" className="space-y-1">{results.map((result) => { const Icon = result.kind === 'project' ? Folder : CheckSquare2; return <li key={result.id}><Link href={result.href} onClick={() => onOpenChange(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-slate-100 dark:hover:bg-slate-800"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"><Icon aria-hidden="true" size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{result.label}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{result.context}</span></span><span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800">{result.kind}</span></Link></li>; })}</ul>}</div>
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800"><span>Only your ClickFlow workspace data is searched.</span><span>Esc to close</span></div>
  </Dialog>;
}