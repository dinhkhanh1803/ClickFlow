import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';
const inter=Inter({subsets:['latin'],variable:'--font-inter'}); const mono=JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});
export const metadata: Metadata = { title: 'ClickFlow', description: 'Your productivity engine' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body className={`${inter.variable} ${mono.variable}`}><ThemeProvider>{children}</ThemeProvider></body></html>; }