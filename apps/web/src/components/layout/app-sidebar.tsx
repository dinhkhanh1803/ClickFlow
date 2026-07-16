'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { navigationItems } from '@clickflow/contracts';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTitle } from '@/components/ui/sheet';
import { useUiStore } from '@/stores/ui-store';

export function AppSidebar(){
  const [open,setOpen]=useState(false); const pathname=usePathname(); const openCreateTask=useUiStore(state=>state.openCreateTask);
  const navigation=<nav className="space-y-1" aria-label="Workspace sections">{navigationItems.map(({label,href})=>{const active=pathname===href; return <Link key={label} href={href} onClick={()=>setOpen(false)} aria-current={active?'page':undefined} className={`block rounded-lg px-3 py-2 text-sm transition ${active?'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200':'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{label}</Link>})}</nav>;
  return <><Button aria-label="Open navigation" className="fixed left-3 top-3 z-40 md:hidden" onClick={()=>setOpen(true)}>Menu</Button><aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start flex-col glass-shell border-r p-4 md:flex" aria-label="Primary navigation"><Link href="/dashboard" className="mb-8 text-xl font-bold text-indigo-600">ClickFlow</Link>{navigation}<Button className="mt-auto" onClick={openCreateTask}>Create New</Button></aside><Sheet open={open} onOpenChange={setOpen}><Button aria-label="Close navigation" variant="ghost" onClick={()=>setOpen(false)}>Close</Button><SheetTitle className="sr-only">Mobile navigation</SheetTitle><Link href="/dashboard" className="my-6 block text-xl font-bold text-indigo-600">ClickFlow</Link>{navigation}<Button className="mt-6 w-full" onClick={()=>{openCreateTask();setOpen(false)}}>Create New</Button></Sheet></>;
}