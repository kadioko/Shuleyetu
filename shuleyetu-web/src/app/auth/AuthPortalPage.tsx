'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';

type PortalType = 'vendor' | 'school';

type PortalConfig = {
  type: PortalType;
  label: string;
  accent: 'sky' | 'amber';
  defaultNext: string;
  title: string;
  description: string;
  signUpDescription: string;
  desktopHeading: string;
  desktopCopy: string;
  features: { title: string; description: string }[];
  noteTitle: string;
  noteCopy: string;
  alternateHref: string;
  alternateLabel: string;
};

const portalConfigs: Record<PortalType, PortalConfig> = {
  vendor: {
    type: 'vendor',
    label: 'Vendor Portal',
    accent: 'sky',
    defaultNext: '/dashboard',
    title: 'Welcome back',
    description: 'Sign in to access your vendor dashboard',
    signUpDescription: 'Sign up to manage your vendor store',
    desktopHeading: 'Run your vendor business with clarity.',
    desktopCopy:
      'Sign in to manage inventory, track orders, and keep your storefront ready for families across Tanzania.',
    features: [
      {
        title: 'Inventory and pricing',
        description: 'Keep your catalog current with a cleaner vendor workflow.',
      },
      {
        title: 'Order visibility',
        description: 'See incoming orders and act faster during peak school seasons.',
      },
    ],
    noteTitle: 'For vendors only',
    noteCopy:
      'After signing up, contact an admin to link your account to your vendor store.',
    alternateHref: '/auth/school-login',
    alternateLabel: 'School staff? Open school login',
  },
  school: {
    type: 'school',
    label: 'School Portal',
    accent: 'amber',
    defaultNext: '/schools/portal',
    title: 'Welcome to the school portal',
    description: 'Sign in to manage your school workspace',
    signUpDescription: 'Create an account for school administration',
    desktopHeading: 'Manage your school workspace in one place.',
    desktopCopy:
      'Sign in to run classes, students, staff, attendance, fees, announcements, and reports without mixing into the vendor dashboard.',
    features: [
      {
        title: 'School operations',
        description: 'Keep classes, student records, staff, and announcements organized.',
      },
      {
        title: 'Attendance and fees',
        description: 'Track daily attendance, fee balances, and reports from one portal.',
      },
    ],
    noteTitle: 'For schools only',
    noteCopy:
      'If your school already has a portal, ask your school admin to link your account. New schools can create a portal after signing in.',
    alternateHref: '/auth/vendor-login',
    alternateLabel: 'Vendor? Open vendor login',
  },
};

function safeNextPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  return value;
}

export function AuthPortalPage({ type }: { type: PortalType }) {
  const searchParams = useSearchParams();
  const config = portalConfigs[type];
  const nextPath = useMemo(
    () => safeNextPath(searchParams.get('next'), config.defaultNext),
    [config.defaultNext, searchParams],
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const accentClasses =
    config.accent === 'amber'
      ? {
          text: 'text-amber-300',
          gradient: 'from-amber-400 to-amber-500',
          focus: 'focus:border-amber-500 focus:ring-amber-500/20',
          shadow: 'shadow-amber-500/25 hover:shadow-amber-400/40',
          bgSoft: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          buttonText: 'text-slate-950',
        }
      : {
          text: 'text-sky-300',
          gradient: 'from-sky-500 to-sky-600',
          focus: 'focus:border-sky-500 focus:ring-sky-500/20',
          shadow: 'shadow-sky-500/25 hover:shadow-sky-400/40',
          bgSoft: 'bg-sky-500/10',
          border: 'border-sky-500/30',
          buttonText: 'text-white',
        };

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        setError('Please enter email and password.');
        return;
      }

      if (isSignUp) {
        const { error } = await supabaseClient.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) {
          setError(error.message);
          return;
        }
        setMessage('Check your email to confirm your account, then log in.');
      } else {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setError(error.message);
          return;
        }
        setMessage(`Logged in successfully. Redirecting to ${config.label.toLowerCase()}...`);
        setTimeout(() => {
          window.location.href = nextPath;
        }, 700);
      }
    } catch (err) {
      console.error('Auth error', err);
      setError('Unexpected error during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
      <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="absolute bottom-20 left-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <Link href="/" className="group inline-flex items-center gap-3 text-2xl font-bold text-slate-50">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClasses.gradient} text-xl font-extrabold ${accentClasses.buttonText} shadow-lg ${accentClasses.shadow} transition-transform group-hover:scale-110`}>
                S
              </div>
              <span className="font-display">Shuleyetu</span>
            </Link>
            <p className={`mt-6 text-xs font-semibold uppercase tracking-[0.28em] ${accentClasses.text}`}>
              {config.label}
            </p>
            <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight text-slate-50">
              {config.desktopHeading}
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              {config.desktopCopy}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {config.features.map((feature) => (
                <div key={feature.title} className="surface-panel rounded-3xl p-5">
                  <p className="text-sm font-semibold text-slate-100">{feature.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="w-full max-w-md justify-self-center lg:max-w-none">
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="group inline-flex items-center gap-3 text-2xl font-bold text-slate-50">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accentClasses.gradient} text-xl font-extrabold ${accentClasses.buttonText} shadow-lg ${accentClasses.shadow} transition-transform group-hover:scale-110`}>
                S
              </div>
              <span className="font-display">Shuleyetu</span>
            </Link>
            <p className="mt-3 text-sm text-slate-400">{config.label}</p>
          </div>

          <div className="surface-panel rounded-[28px] p-8 shadow-2xl shadow-slate-950/80">
            <div className="mb-8 text-center">
              <h1 className="font-display text-2xl font-bold text-slate-50">
                {isSignUp ? 'Create your account' : config.title}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {isSignUp ? config.signUpDescription : config.description}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg className="h-5 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className={`w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3.5 pl-12 pr-4 text-base text-slate-50 placeholder-slate-500 outline-none transition-all focus:ring-2 ${accentClasses.focus}`}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    className={`w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-50 placeholder-slate-500 outline-none transition-all focus:ring-2 ${accentClasses.focus}`}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/30 p-3">
                  <svg className="h-5 w-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {message && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3">
                  <svg className="h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-emerald-200">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${accentClasses.gradient} px-4 py-3.5 text-sm font-bold ${accentClasses.buttonText} shadow-lg ${accentClasses.shadow} transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100`}
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Create account' : `Sign in to ${config.label}`}
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                }}
                className={`text-sm text-slate-400 transition-colors hover:${accentClasses.text}`}
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
              <div>
                <Link href={config.alternateHref} className={`text-sm font-medium ${accentClasses.text} transition-colors hover:text-slate-100`}>
                  {config.alternateLabel}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="surface-panel rounded-3xl p-4">
              <div className="flex gap-3">
                <div className={`flex-shrink-0 ${accentClasses.text}`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-xs text-slate-400">
                  <p className="font-medium text-slate-300">{config.noteTitle}</p>
                  <p className="mt-1">{config.noteCopy}</p>
                </div>
              </div>
            </div>

            <div className="surface-panel rounded-3xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Need public ordering instead?</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Parents can place or track orders without using an internal portal.
                  </p>
                </div>
                <Link href="/orders" className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-sky-500/30 hover:text-sky-300">
                  View orders
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-sky-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
