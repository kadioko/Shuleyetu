'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { getWorkspaceSummary, type WorkspaceSummary } from '@/lib/workspaces';

type NavUserState = {
  email: string | null;
};

export function NavUser() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<NavUserState | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!isMounted) return;

        if (!user) {
          setUser(null);
          setWorkspaces(null);
        } else {
          setUser({ email: user.email ?? null });
          const { data } = await getWorkspaceSummary();
          if (isMounted) setWorkspaces(data);
        }
      } catch (error) {
        console.error('Error loading nav user', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.error('Error during logout', error);
    } finally {
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <span className="hidden text-[11px] text-slate-400 sm:inline-flex">
        …
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth/vendor-login"
        className="inline-flex min-h-[44px] items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:border-sky-400/30 hover:bg-white/10 hover:text-sky-300"
      >
        Login
      </Link>
    );
  }

  const accessCount = workspaces
    ? Number(workspaces.hasVendor) + Number(workspaces.hasSchool) + Number(workspaces.isAdmin)
    : 0;
  const primaryWorkspace = workspaces?.isAdmin
    ? { href: '/admin', label: 'Admin' }
    : accessCount > 1
      ? { href: '/workspaces', label: 'Workspaces' }
      : workspaces?.hasVendor
        ? { href: '/dashboard', label: 'Vendor Dashboard' }
        : workspaces?.hasSchool
          ? { href: '/schools/portal', label: 'School Portal' }
          : { href: '/auth/login', label: 'Choose Portal' };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={primaryWorkspace.href}
        className="hidden min-h-[44px] items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:border-sky-400/30 hover:bg-white/10 hover:text-sky-300 md:inline-flex"
      >
        {primaryWorkspace.label}
      </Link>
      <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10 text-xs font-bold uppercase text-sky-300">
          {(user.email ?? 'V').slice(0, 1)}
        </span>
        <span className="max-w-[180px] truncate text-xs font-medium text-slate-200">
          {user.email ?? 'Vendor'}
        </span>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex min-h-[44px] items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:border-sky-400/30 hover:bg-white/10 hover:text-sky-300"
      >
        Logout
      </button>
    </div>
  );
}
