'use client';

import { useState } from 'react';
import { AppSidebar, type GlobalModulePath } from '@/components/layout/app-sidebar';
import { ContextSidebar } from '@/components/layout/context-sidebar';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { notifyToastPreview } from '@/lib/feedback/toast-feedback';

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 glass-shell border-b px-6"><div className="text-sm text-slate-500">Workspace / Dashboard</div><Input aria-label="Search" className="hidden w-64 md:block" placeholder="Search tasks, projects..." /><div className="flex items-center gap-2"><ThemeToggle /><Button aria-label="Notifications" variant="ghost" size="sm" onClick={notifyToastPreview}>Notifications</Button><Button aria-label="Open account menu" variant="ghost" size="sm" className="rounded-full bg-indigo-100 font-bold text-indigo-700" onClick={() => setMenuOpen((value) => !value)}>K</Button>{menuOpen && <div role="menu" className="glass-surface rounded-xl p-1"><button role="menuitem" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Profile</button><button role="menuitem" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Workspace settings</button></div>}</div></header>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [previewModule, setPreviewModule] = useState<GlobalModulePath | null>(null);
  const [contextPanelCollapsed, setContextPanelCollapsed] = useState(false);

  return <div className="flex min-h-screen"><AppSidebar onPreviewModuleChange={setPreviewModule} onModuleSelect={() => setContextPanelCollapsed(false)} /><div className={`relative sticky top-0 hidden h-screen shrink-0 self-start md:block ${contextPanelCollapsed ? 'w-0' : 'w-72'}`}>{!contextPanelCollapsed && <ContextSidebar onCollapse={() => setContextPanelCollapsed(true)} />}{previewModule && <ContextSidebar modulePath={previewModule} preview />}</div><main className="min-w-0 flex-1"><AppHeader />{children}</main></div>;
}