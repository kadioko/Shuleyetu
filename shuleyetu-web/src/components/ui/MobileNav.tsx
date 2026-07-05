'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { supabaseClient } from '@/lib/supabaseClient';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/orders', label: 'Orders' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/schools/portal', label: 'Schools' },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        setIsLoggedIn(Boolean(session));
      } catch (error) {
        console.error('MobileNav: failed to check session', error);
        setIsLoggedIn(false);
      }
    };
    void checkSession();

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data: { subscription: sub } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
        setIsLoggedIn(Boolean(session));
      });
      subscription = sub;
    } catch (error) {
      console.error('MobileNav: failed to subscribe to auth state', error);
    }

    return () => subscription?.unsubscribe();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus first link when menu opens
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstLink = menuRef.current.querySelector('a');
      firstLink?.focus();
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition-all hover:border-sky-400/30 hover:bg-white/10 hover:text-white"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-menu"
      >
        {isOpen ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            role="presentation"
            aria-hidden="true"
          />
          <nav
            id="mobile-nav-menu"
            ref={menuRef}
            className="fixed inset-x-3 top-20 z-50 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.5)] backdrop-blur-2xl"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="mb-4 rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
                Navigate Shuleyetu
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Jump between discovery, orders, and your vendor workspace.
              </p>
            </div>
            <ul className="space-y-2" role="menubar">
              {navLinks.map((link) => (
                <li key={link.href} role="none">
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-all',
                      pathname === link.href
                        ? 'bg-sky-500/10 text-sky-300 shadow-[inset_0_1px_0_rgba(125,211,252,0.2)]'
                        : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
                    )}
                    role="menuitem"
                  >
                    <span>{link.label}</span>
                    <svg className="ml-auto h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-white/10 pt-4">
              {isLoggedIn ? (
                <button
                  onClick={async () => {
                    setIsOpen(false);
                    await supabaseClient.auth.signOut();
                    router.push('/');
                  }}
                  className="block w-full rounded-2xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-center text-sm font-semibold text-slate-300 transition-all hover:border-red-500/40 hover:text-red-400"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 text-center text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition-all hover:from-sky-400 hover:to-sky-500"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
