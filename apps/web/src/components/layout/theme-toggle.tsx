'use client';
import { useTheme } from 'next-themes';
export function ThemeToggle(){ const { theme, setTheme }=useTheme(); return <button type="button" aria-label="Toggle theme" onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="rounded-md p-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">◐</button>; }
