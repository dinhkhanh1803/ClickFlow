import Link from 'next/link';

const items = ['Dashboard', 'My Tasks', 'Calendar', 'Time Tracking', 'Projects', 'Templates', 'Reports', 'Archive', 'Settings'];

export function AppSidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white p-4" aria-label="Primary navigation">
      <Link href="/dashboard" className="mb-8 text-xl font-bold text-indigo-600">ClickFlow</Link>
      <nav className="space-y-1">
        {items.map((item) => <Link key={item} href={item === 'Dashboard' ? '/dashboard' : `/${item.toLowerCase().replaceAll(' ', '-')}`} className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">{item}</Link>)}
      </nav>
      <button type="button" className="mt-auto rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white">Create New</button>
    </aside>
  );
}
