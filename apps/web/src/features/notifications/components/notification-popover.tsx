'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react';

import { useAuthStore } from '@/features/auth/model/auth-store';
import { useWorkspaceNavigationQuery } from '@/features/workspace/data/workspace-queries';
import { mapActivityNotifications } from '../model/notification-model';

const READ_STORAGE_PREFIX = 'clickflow.notifications.read.v1';

function readStorage(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []);
  } catch {
    return new Set();
  }
}

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const userId = useAuthStore((state) => state.user?.id ?? 'anonymous');
  const storageKey = `${READ_STORAGE_PREFIX}:${userId}`;
  const [readIds, setReadIds] = useState<Set<string>>(() => readStorage(storageKey));
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigation = useWorkspaceNavigationQuery();
  const notifications = useMemo(
    () => mapActivityNotifications(navigation.activities, navigation.tasks, userId, readIds),
    [navigation.activities, navigation.tasks, userId, readIds],
  );
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify([...readIds]));
  }, [readIds, storageKey]);
  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !popoverRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const markAsRead = (id: string) => {
    setReadIds((current) => new Set([...current, id]));
    setOpen(false);
  };
  const markAllAsRead = () => setReadIds((current) => new Set([...current, ...notifications.map(({ id }) => id)]));

  return <div ref={popoverRef} className="relative">
    <button type="button" aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
      <Bell aria-hidden="true" size={18} />
      {unreadCount > 0 && <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950" />}
    </button>
    {open && <section role="dialog" aria-label="Notifications" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div><h2 className="text-sm font-semibold">Notifications</h2><p className="text-xs text-slate-500">{unreadCount ? `${unreadCount} unread` : 'You are all caught up'}</p></div>
        {unreadCount > 0 && <button type="button" onClick={markAllAsRead} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"><CheckCheck aria-hidden="true" size={14} />Mark all as read</button>}
      </header>
      <div className="max-h-96 overflow-y-auto">
        {navigation.isLoading && <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} />Loading activity…</p>}
        {!navigation.isLoading && notifications.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">No personal notifications yet.</p>}
        {notifications.map((notification) => <Link key={notification.id} href={notification.href} onClick={() => markAsRead(notification.id)} className={`relative block border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70 ${notification.read ? '' : 'bg-indigo-50/60 dark:bg-indigo-950/20'}`}>
          {!notification.read && <span aria-label="Unread" className="absolute right-4 top-4 h-2 w-2 rounded-full bg-indigo-500" />}
          <p className="pr-5 text-sm font-semibold text-slate-900 dark:text-white">{notification.title}</p>
          <p className="mt-1 pr-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{notification.description}</p>
          <time className="mt-1 block text-[11px] font-medium text-slate-400">{notification.time}</time>
        </Link>)}
      </div>
    </section>}
  </div>;
}
