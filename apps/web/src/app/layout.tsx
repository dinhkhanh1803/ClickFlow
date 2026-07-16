import type { Metadata } from 'next';
import { Hanken_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import './globals.css';
const heading=Hanken_Grotesk({subsets:['latin'],variable:'--font-heading'}); const inter=Inter({subsets:['latin'],variable:'--font-inter'}); const mono=JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});
export const metadata: Metadata = { title: 'ClickFlow', description: 'Your productivity engine' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body className={`${heading.variable} ${inter.variable} ${mono.variable}`}><ThemeProvider><QueryProvider>{children}<ToastProvider /></QueryProvider></ThemeProvider></body></html>; }