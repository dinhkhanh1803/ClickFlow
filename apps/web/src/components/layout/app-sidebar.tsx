'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, Box, Calendar, CheckSquare, Clock3, Home, Menu, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTitle } from '@/components/ui/sheet';
import { useUiStore } from '@/stores/ui-store';

const modules = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Spaces', href: '/projects', icon: Box },
  { label: 'My Tasks', href: '/my-tasks', icon: CheckSquare },
  { label: 'Planner', href: '/calendar', icon: Calendar },
  { label: 'Time', href: '/time-tracking', icon: Clock3 },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function ModuleLinks({ compact, onNavigate }: { compact: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Global navigation" className={compact ? 'flex flex-1 flex-col items-center gap-2' : 'space-y-1'}>{modules.map(({ label, href, icon: Icon }) => { const active = pathname === href; return <Link key={label} href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined} aria-label={label} title={compact ? label : undefined} className={compact ? `grid h-11 w-11 place-items-center rounded-xl transition ${active ? 'bg-white/25 text-white shadow-lg shadow-indigo-950/20' : 'text-indigo-100 hover:bg-white/15 hover:text-white'}` : `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Icon size={compact ? 19 : 18} aria-hidden="true" /><span className={compact ? 'sr-only' : ''}>{label}</span></Link> })}</nav>;
}

export function AppSidebar(){
  const [open,setOpen]=useState(false); const openCreateTask=useUiStore(state=>state.openCreateTask);
  return <><Button aria-label="Open navigation" className="fixed left-3 top-3 z-40 md:hidden" onClick={()=>setOpen(true)}><Menu size={18} /></Button><aside className="sticky top-0 hidden h-screen w-[76px] shrink-0 self-start flex-col items-center border-r border-indigo-400/25 bg-indigo-600/95 px-2 py-3 shadow-xl shadow-indigo-950/15 md:flex" aria-label="ClickFlow application"><Link href="/dashboard" aria-label="ClickFlow home" className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-white text-sm font-extrabold text-indigo-600 shadow-lg shadow-indigo-950/20">CF</Link><ModuleLinks compact /><Button aria-label="Create new" title="Create new" className="mt-3 h-11 w-11 rounded-xl px-0 shadow-lg shadow-indigo-950/20" onClick={openCreateTask}><Plus size={20} /></Button></aside><Sheet open={open} onOpenChange={setOpen}><SheetTitle>ClickFlow</SheetTitle><Link href="/dashboard" className="my-6 block text-xl font-bold text-indigo-600">ClickFlow</Link><ModuleLinks compact={false} onNavigate={()=>setOpen(false)} /><Button className="mt-6 w-full" onClick={()=>{openCreateTask();setOpen(false)}}><Plus size={18} />Create new</Button></Sheet></>;
}