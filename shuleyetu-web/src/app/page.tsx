'use client';

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { Accordion } from "@/components/ui/Accordion";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <main className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-sky-800/10 via-transparent to-transparent" />
        
        {/* Decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
        
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 md:px-6 md:py-32 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:py-36">
          <div className="max-w-3xl space-y-8 animate-fade-in">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400 backdrop-blur-sm animate-slide-down">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
              </span>
              {t('heroTagline')}
            </div>
            
            {/* Main heading with gradient */}
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-slate-50 md:text-6xl lg:text-7xl animate-slide-up">
              {t('heroTitle')}
              <span className="block mt-2 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
                {t('heroTitleHighlight')}
              </span>
            </h1>
            
            {/* Description */}
            <p className="text-xl text-slate-300 md:text-2xl leading-relaxed max-w-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {t('heroDescription')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link
                href="/vendors"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-sky-500/30 transition-all duration-300 hover:scale-105 hover:shadow-sky-400/40 hover:from-sky-400 hover:to-sky-500"
              >
                <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                {t('browseVendors')}
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/schools/portal"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-4 text-base font-bold text-slate-950 shadow-2xl shadow-amber-500/20 transition-all duration-300 hover:scale-105 hover:shadow-amber-400/30 hover:from-amber-300 hover:to-amber-400"
              >
                <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0118.5 17.25c0 1.01-.672 1.9-1.646 2.171A18.487 18.487 0 0112 20a18.487 18.487 0 01-4.854-.579A2.25 2.25 0 015.5 17.25c0-2.35.67-4.55 1.84-6.672L12 14z" />
                </svg>
                Open School Portal
              </Link>
              <Link
                href="/orders/new"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-600 bg-slate-900/50 px-8 py-4 text-base font-bold text-slate-100 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-sky-500 hover:bg-slate-800/80 hover:text-white"
              >
                <svg className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t('createOrder')}
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-6 text-sm text-slate-400 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Trusted by 100+ vendors</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">5000+ products available</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">24/7 support</span>
              </div>
            </div>
          </div>

          <div className="surface-panel hidden rounded-[28px] p-6 lg:block">
            <div className="rounded-3xl border border-sky-500/15 bg-gradient-to-br from-sky-500/10 via-transparent to-emerald-500/10 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
                    Why teams choose Shuleyetu
                  </p>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-50">
                    Faster back-to-school coordination
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Live marketplace
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-slate-100">Compare vendors quickly</p>
                  <p className="mt-1 text-sm text-slate-400">Browse pricing, regions, and product categories in one flow.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-slate-100">Track every order clearly</p>
                  <p className="mt-1 text-sm text-slate-400">Parents and schools get a simpler journey from ordering to collection.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-slate-100">Help vendors sell smarter</p>
                  <p className="mt-1 text-sm text-slate-400">Give local suppliers a digital storefront that feels professional and modern.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating decoration elements */}
        <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-20 left-10 h-96 w-96 rounded-full bg-sky-600/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </section>

      {/* Choose your path */}
      <section className="border-b border-slate-800 bg-slate-950/70">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-18">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-extrabold text-slate-50 md:text-4xl">
                Choose where you need to go
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-400 md:text-lg">
                Shuleyetu now serves three different journeys. Pick the path that matches your role and continue with the right tools.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Link
                href="/vendors"
                className="group rounded-3xl border border-sky-500/20 bg-sky-500/10 p-6 transition-all hover:-translate-y-1 hover:border-sky-400/40 hover:bg-sky-500/15"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M5 7l1 12h12l1-12M9 7V5a3 3 0 116 0v2" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-50">Parents</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Browse vendors, compare school supplies, and start an order.</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
                  Browse vendors
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>

              <Link
                href="/dashboard"
                className="group rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 transition-all hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-emerald-500/15"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-50">Vendors</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Manage products, inventory, customer orders, and sales activity.</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  Vendor dashboard
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>

              <Link
                href="/schools/portal"
                className="group rounded-3xl border border-amber-400/30 bg-amber-400/10 p-6 shadow-lg shadow-amber-500/5 transition-all hover:-translate-y-1 hover:border-amber-300/50 hover:bg-amber-400/15"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0118.5 17.25c0 1.01-.672 1.9-1.646 2.171A18.487 18.487 0 0112 20a18.487 18.487 0 01-4.854-.579A2.25 2.25 0 015.5 17.25c0-2.35.67-4.55 1.84-6.672L12 14z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-50">Schools</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Run classes, students, attendance, fees, staff, and announcements.</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                  Open school portal
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="surface-panel text-center group rounded-3xl p-6">
              <p className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text md:text-4xl transition-transform group-hover:scale-110">100+</p>
              <p className="text-sm text-slate-400 md:text-base font-medium mt-2">{t('vendorsCount')}</p>
            </div>
            <div className="surface-panel text-center group rounded-3xl p-6">
              <p className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text md:text-4xl transition-transform group-hover:scale-110">5000+</p>
              <p className="text-sm text-slate-400 md:text-base font-medium mt-2">{t('productsCount')}</p>
            </div>
            <div className="surface-panel text-center group rounded-3xl p-6">
              <p className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text md:text-4xl transition-transform group-hover:scale-110">26</p>
              <p className="text-sm text-slate-400 md:text-base font-medium mt-2">{t('regionsCount')}</p>
            </div>
            <div className="surface-panel text-center group rounded-3xl p-6">
              <p className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text md:text-4xl transition-transform group-hover:scale-110">24/7</p>
              <p className="text-sm text-slate-400 md:text-base font-medium mt-2">{t('support')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-extrabold text-slate-50 md:text-4xl lg:text-5xl">{t('builtForEveryone')}</h2>
          <p className="mt-4 text-base text-slate-400 md:text-lg max-w-2xl mx-auto">{t('builtForEveryoneDesc')}</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="surface-panel group rounded-3xl p-8 transition-all duration-300 hover:border-sky-500/30 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1">

            <div className="mb-6 inline-flex rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 p-4 text-sky-400 group-hover:scale-110 transition-transform duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-50">{t('forParents')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('findTrustedVendors')}
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('comparePrices')}
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('paySecurely')}
              </li>
            </ul>
            <Link
              href="/vendors"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 transition-colors hover:text-sky-200"
            >
              Start shopping
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="surface-panel group rounded-3xl p-8 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1">

            <div className="mb-6 inline-flex rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-4 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-50">{t('forVendors')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('manageInventory')}
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('trackOrders')}
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('reachCustomers')}
              </li>
            </ul>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
            >
              Go to vendor dashboard
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="surface-panel group rounded-3xl p-8 transition-all duration-300 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1">

            <div className="mb-6 inline-flex rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-4 text-amber-400 group-hover:scale-110 transition-transform duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-50">{t('forSchools')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('standardiseBookLists')}
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('recommendVendors')}
              </li>
              <li className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('reduceRush')}
              </li>
            </ul>
            <Link
              href="/schools/portal"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 transition-colors hover:text-amber-100"
            >
              Open school portal
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-extrabold text-slate-50 md:text-4xl lg:text-5xl">{t('howItWorks')}</h2>
            <p className="mt-4 text-base text-slate-400 md:text-lg max-w-2xl mx-auto">{t('howItWorksDesc')}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="surface-panel relative rounded-3xl p-8 text-center group">

              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-2xl font-bold text-white shadow-xl shadow-sky-500/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-sky-500/40">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-50 mb-3">{t('findVendor')}</h3>
              <p className="text-base text-slate-400 leading-relaxed">
                {t('findVendorDesc')}
              </p>
            </div>

            <div className="surface-panel relative rounded-3xl p-8 text-center group">

              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-2xl font-bold text-white shadow-xl shadow-sky-500/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-sky-500/40">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-50 mb-3">{t('placeOrder')}</h3>
              <p className="text-base text-slate-400 leading-relaxed">
                {t('placeOrderDesc')}
              </p>
            </div>

            <div className="surface-panel relative rounded-3xl p-8 text-center group">

              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-2xl font-bold text-white shadow-xl shadow-sky-500/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-sky-500/40">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-50 mb-3">{t('payCollect')}</h3>
              <p className="text-base text-slate-400 leading-relaxed">
                {t('payCollectDesc')}
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/vendors"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-sky-500/30 transition-all duration-300 hover:scale-105 hover:shadow-sky-400/40"
            >
              {t('getStarted')}
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-50 mb-3">Trusted by Schools & Parents</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              See what our community says about shopping with Shuleyetu
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                quote: "Shuleyetu saved us hours of running from shop to shop. We ordered everything online and it was delivered to the school.",
                author: "Grace M.",
                role: "Parent, Dar es Salaam",
              },
              {
                quote: "As a vendor, I have reached more customers through the platform than I ever could with my physical shop alone.",
                author: "Joseph K.",
                role: "School Supplies Vendor",
              },
              {
                quote: "The school portal helps us track fees and attendance in one place. Our admin workload has dropped significantly.",
                author: "Sr. Agnes L.",
                role: "School Administrator, Arusha",
              },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
                <div className="mb-4 text-sky-400 text-2xl">&ldquo;</div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">{t.quote}</p>
                <div className="border-t border-slate-700/50 pt-4">
                  <p className="font-medium text-slate-200 text-sm">{t.author}</p>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-extrabold text-slate-50 md:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-slate-400 md:text-lg max-w-2xl mx-auto">
            Find answers to common questions about Shuleyetu and how it works.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion
            items={[
              {
                id: 'faq-1',
                question: 'How do I get started with Shuleyetu?',
                answer: 'Getting started is simple! Browse our vendors to see available products, create an order with the items you need, and our vendors will process your order. You can track your order status in real-time through your dashboard.',
              },
              {
                id: 'faq-2',
                question: 'Is it safe to buy from vendors on Shuleyetu?',
                answer: 'Yes! All vendors on Shuleyetu are verified and trusted. We work with established suppliers across Tanzania to ensure quality products and reliable service. Each vendor has ratings and reviews from other customers.',
              },
              {
                id: 'faq-3',
                question: 'What payment methods do you accept?',
                answer: 'We accept multiple payment methods including mobile money (M-Pesa, Airtel Money), bank transfers, and cash on delivery for select regions. Choose the method that works best for you during checkout.',
              },
              {
                id: 'faq-4',
                question: 'How long does delivery take?',
                answer: 'Delivery times vary by location and vendor. Most orders are delivered within 2-7 business days. You can see estimated delivery times for each vendor before placing your order.',
              },
              {
                id: 'faq-5',
                question: 'Can I cancel or modify my order?',
                answer: 'You can cancel or modify your order within 24 hours of placing it. After that, contact our support team for assistance. We want to make sure you get exactly what you need.',
              },
              {
                id: 'faq-6',
                question: 'Do you offer bulk discounts for schools?',
                answer: 'Yes! Schools and institutions can get special bulk pricing. Contact our sales team at schools@shuleyetu.com to discuss volume discounts and custom arrangements.',
              },
            ]}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="surface-panel relative overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-950/50 to-slate-900/50 p-12 text-center md:p-16">

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold text-slate-50 md:text-4xl lg:text-5xl">
              {t('readyToSimplify')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300 md:text-xl leading-relaxed">
              {t('ctaDescription')}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/vendors"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-sky-500/30 transition-all duration-300 hover:scale-105 hover:shadow-sky-400/40"
              >
                {t('browseVendors')}
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/auth/vendor-login?next=/vendor/onboarding"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-600 bg-slate-900/50 px-8 py-4 text-base font-bold text-slate-100 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-sky-500 hover:bg-slate-800/80"
              >
                {t('vendorSignUp')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
