'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useLogoutMutation } from '../data/auth-mutations';

export function LogoutButton({ onLogout }: { onLogout?: () => void }) {
  const router = useRouter();
  const logout = useLogoutMutation();

  const handleLogout = async () => {
    await logout.mutateAsync();
    onLogout?.();
    router.replace('/login');
    router.refresh();
  };

  return <button
    type="button"
    role="menuitem"
    disabled={logout.isPending}
    onClick={() => void handleLogout()}
    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-950/30"
  >
    <LogOut aria-hidden="true" size={16} />
    {logout.isPending ? 'Logging out...' : 'Log out'}
  </button>;
}
