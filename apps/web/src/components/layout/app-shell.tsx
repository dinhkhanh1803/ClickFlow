'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, Search, Settings2, UserRound } from 'lucide-react';
import { AppSidebar, type GlobalModulePath } from '@/components/layout/app-sidebar';
import { ContextSidebar } from '@/components/layout/context-sidebar';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { useAuthStore } from '@/features/auth/model/auth-store';
import { GlobalSearchDialog } from '@/features/search/components/global-search-dialog';
import { notifyToastPreview } from '@/lib/feedback/toast-feedback';

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const initials = user?.displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CF';

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);
  useEffect(() => {
    const openSearchShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;
      event.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener('keydown', openSearchShortcut);
    return () => window.removeEventListener('keydown', openSearchShortcut);
  }, []);

  return <><header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 px-6 glass-shell dark:border-slate-800/90"><div className="text-sm text-slate-500">Workspace / Dashboard</div><button type="button" aria-label="Search ClickFlow" onClick={() => setSearchOpen(true)} className="flex h-9 w-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/70 text-slate-500 transition hover:border-indigo-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-white md:h-10 md:w-64 md:px-3"><Search aria-hidden="true" size={17} /><span className="hidden flex-1 text-left text-sm md:inline">Search</span><kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700 dark:text-slate-400 md:inline">Ctrl K</kbd></button><div className="flex items-center gap-1"><ThemeToggle /><Button aria-label="Notifications" title="Notifications" variant="ghost" size="sm" className="h-9 w-9 rounded-lg px-0 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" onClick={notifyToastPreview}><Bell aria-hidden="true" size={18} /></Button><div ref={accountMenuRef} className="relative ml-1"><button type="button" aria-label="Open account menu" aria-haspopup="true" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)} className="flex h-9 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 py-0.5 pl-0.5 pr-1.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 dark:hover:bg-indigo-950 dark:focus:ring-offset-slate-950"><span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-600 text-xs text-white">{initials}</span><ChevronDown aria-hidden="true" size={14} className={menuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>{menuOpen && <div role="menu" aria-label="Account menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15 dark:border-slate-700 dark:bg-slate-900"><div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800"><p className="text-sm font-semibold">{user?.displayName ?? 'ClickFlow user'}</p><p className="text-xs text-slate-500">{user?.email ?? 'Authenticated session'}</p></div><Link href="/profile" onClick={() => setMenuOpen(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"><UserRound aria-hidden="true" size={16} />Profile</Link><Link href="/workspace-settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"><Settings2 aria-hidden="true" size={16} />Workspace settings</Link><div className="my-1 border-t border-slate-100 dark:border-slate-800" /><LogoutButton onLogout={() => setMenuOpen(false)} /></div>}</div></div></header><GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} /></>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [previewModule, setPreviewModule] = useState<GlobalModulePath | null>(null);
  const [contextPanelCollapsed, setContextPanelCollapsed] = useState(false);

  return <div className="flex min-h-screen"><AppSidebar onPreviewModuleChange={setPreviewModule} onModuleSelect={() => setContextPanelCollapsed(false)} /><div className={`relative sticky top-0 hidden h-screen shrink-0 self-start md:block ${contextPanelCollapsed ? 'w-0' : 'w-72'}`}>{!contextPanelCollapsed && <ContextSidebar onCollapse={() => setContextPanelCollapsed(true)} />}{previewModule && <ContextSidebar modulePath={previewModule} preview />}</div><main className="min-w-0 flex-1"><AppHeader />{children}</main></div>;
}