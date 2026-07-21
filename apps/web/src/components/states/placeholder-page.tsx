'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type State = 'ready' | 'loading' | 'empty' | 'error';

const stateCopy: Record<Exclude<State, 'ready'>, { title: string; body: string }> = {
  loading: { title: 'Loading data', body: 'Fetching the latest mock workspace data.' },
  empty: { title: 'Nothing here yet', body: 'Create your first item when this workflow is implemented in Phase 2.' },
  error: { title: 'Unable to load this view', body: 'This mock error state demonstrates recovery affordances and accessible feedback.' },
};

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  const [state, setState] = useState<State>('ready');
  const copy = state === 'ready' ? null : stateCopy[state];
  return <section className="p-6"><p className="text-sm text-slate-500">ClickFlow / {title}</p><h1 className="mt-2 text-3xl font-bold">{title}</h1><div className="mt-6 flex flex-wrap gap-2" aria-label="Preview UI state"><Button variant="outline" size="sm" aria-label="Loading state" onClick={() => setState('loading')}>Loading</Button><Button variant="outline" size="sm" aria-label="Empty state" onClick={() => setState('empty')}>Empty</Button><Button variant="outline" size="sm" aria-label="Error state" onClick={() => setState('error')}>Error</Button><Button variant="ghost" size="sm" onClick={() => setState('ready')}>Reset</Button></div><Card className="mt-4"><CardHeader><CardTitle>{copy?.title ?? description}</CardTitle></CardHeader><CardContent>{copy ? <p className="text-sm text-slate-500" role={state === 'error' ? 'alert' : 'status'}>{copy.body}</p> : <p className="text-sm text-slate-500">This Phase 1 screen uses typed mock state only. Feature implementation begins in Phase 2.</p>}</CardContent></Card></section>;
}