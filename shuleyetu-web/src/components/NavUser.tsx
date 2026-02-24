'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

type NavUserState = {
  email: string | null;
};

export function NavUser() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<NavUserState | null>(null);

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
        } else {
          setUser({ email: user.email ?? null });
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
      <span className="hidden text-[11px] text-slate-500 sm:inline-flex">
        …
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-900/50 hover:text-sky-400"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200 sm:inline-flex">
        {user.email ?? 'Vendor'}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-900/50 hover:text-sky-400"
      >
        Logout
      </button>
    </div>
  );
}
