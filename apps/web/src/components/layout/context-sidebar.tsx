'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft, MoreHorizontal, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notifyToastPreview } from '@/lib/feedback/toast-feedback';
import type { GlobalModulePath } from '@/components/layout/app-sidebar';

type ContextItem = { label: string; href: string };
type ContextConfig = { title: string; items: ContextItem[]; section?: string; spaces?: { name: string; tone: string; private?: boolean }[] };

const contexts: Record<GlobalModulePath, ContextConfig> = {
  '/dashboard': { title: 'Home', items: [{ label: 'Overview', href: '/dashboard' }, { label: 'Recent activity', href: '/dashboard?view=activity' }, { label: 'Upcoming', href: '/dashboard?view=upcoming' }] },
  '/projects': { title: 'Spaces', items: [{ label: 'All Tasks', href: '/my-tasks' }, { label: 'Shared with me', href: '/projects?view=shared' }], section: 'Spaces', spaces: [{ name: 'Space 1', tone: 'bg-indigo-500' }, { name: 'Space 2', tone: 'bg-orange-500', private: true }, { name: 'Space 3', tone: 'bg-pink-500', private: true }] },
  '/my-tasks': { title: 'My Tasks', items: [{ label: 'Today', href: '/my-tasks' }, { label: 'Upcoming', href: '/my-tasks?view=upcoming' }, { label: 'Completed', href: '/my-tasks?view=completed' }] },
  '/calendar': { title: 'Planner', items: [{ label: 'Calendar', href: '/calendar' }, { label: 'Schedule', href: '/calendar?view=schedule' }, { label: 'Focus', href: '/calendar?view=focus' }] },
  '/time-tracking': { title: 'Time', items: [{ label: 'Timer', href: '/time-tracking' }, { label: 'Timesheet', href: '/time-tracking?view=timesheet' }, { label: 'Weekly summary', href: '/time-tracking?view=weekly' }] },
  '/reports': { title: 'Reports', items: [{ label: 'Overview', href: '/reports' }, { label: 'Project health', href: '/reports?view=health' }, { label: 'Time report', href: '/reports?view=time' }] },
  '/settings': { title: 'Settings', items: [{ label: 'General', href: '/settings' }, { label: 'Workspace', href: '/settings?view=workspace' }, { label: 'Notifications', href: '/settings?view=notifications' }] },
};

type ContextSidebarProps = {
  modulePath?: GlobalModulePath;
  preview?: boolean;
  onCollapse?: () => void;
};

export function ContextSidebar({ modulePath, preview = false, onCollapse }: ContextSidebarProps) {
  const pathname = usePathname();
  const routeModulePath = pathname in contexts ? pathname as GlobalModulePath : '/dashboard';
  const context = contexts[modulePath ?? routeModulePath];

  return (
    <aside aria-label={`${context.title} ${preview ? 'preview' : 'navigation'}`} className={`glass-shell hidden h-screen w-72 shrink-0 flex-col border-r border-white/30 p-3 md:flex ${preview ? 'absolute left-0 top-0 z-20 rounded-r-2xl border border-white/45 shadow-2xl shadow-slate-950/20' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{context.title}</h2>
        <div className="flex items-center gap-1">
          <Button aria-label={`${context.title} options`} variant="ghost" size="sm"><MoreHorizontal size={17} /></Button>
          <Button aria-label={`Search ${context.title}`} variant="ghost" size="sm"><Search size={17} /></Button>
          <Button aria-label="Collapse panel" variant="ghost" size="sm" onClick={onCollapse}><ChevronsLeft size={17} /></Button>
          <Button aria-label={`Create ${context.title === 'Spaces' ? 'space' : 'new item'}`} size="sm" onClick={notifyToastPreview}><Plus size={17} /></Button>
        </div>
      </div>
      <nav className="mt-5 space-y-1">
        {context.items.map((item) => (
          <Link key={item.label} href={item.href} aria-current={item.href === pathname ? 'page' : undefined} className={`block rounded-lg px-3 py-2 text-sm transition ${item.href === pathname ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-600 hover:bg-white/55 dark:text-slate-300 dark:hover:bg-slate-800/70'}`}>
            {item.label}
          </Link>
        ))}
      </nav>
      {context.spaces && <>
        <div className="my-4 border-t border-white/40 dark:border-slate-700/60" />
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{context.section}</p>
        <nav className="mt-2 space-y-1">
          {context.spaces.map((space, index) => (
            <Link key={space.name} href={`/projects?space=${space.name.toLowerCase()}`} aria-current={index === 0 ? 'page' : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${index === 0 ? 'bg-slate-900/10 font-semibold text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-600 hover:bg-white/55 dark:text-slate-300 dark:hover:bg-slate-800/70'}`}>
              <span className={`h-5 w-5 rounded-md ${space.tone}`} /><span>{space.name}</span>{space.private && <span className="ml-auto text-xs text-slate-400">Private</span>}
            </Link>
          ))}
        </nav>
      </>}
    </aside>
  );
}