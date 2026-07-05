'use client';

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-slate-950 to-slate-950/50 safe-area-bottom">
      <div className="border-b border-white/10 bg-slate-900/20 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-950/60 via-slate-900/70 to-slate-900/50 p-8 shadow-[0_24px_80px_rgba(2,6,23,0.35)] md:p-12">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300/80">
                  Stay in the loop
                </p>
                <h3 className="mt-3 font-display text-2xl font-bold text-slate-50 md:text-3xl">
                  Stay Updated
                </h3>
                <p className="mt-3 max-w-xl text-slate-300">
                  Get the latest updates on new vendors, products, and exclusive offers.
                </p>
              </div>
              <div className="space-y-3">
                <form onSubmit={handleSubscribe} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-50 placeholder-slate-500 transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 font-bold text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-sky-500/30"
                  >
                    Subscribe
                  </button>
                </form>
                <p className="text-xs text-slate-400">
                  Product updates, vendor spotlights, and back-to-school campaign news.
                </p>
              </div>
              {subscribed && (
                <p className="col-span-full text-sm text-sky-400">✓ Thank you for subscribing!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 grid gap-8 md:grid-cols-4">
            <div>
              <h4 className="font-display text-lg font-bold text-slate-50 mb-4">Shuleyetu</h4>
              <p className="text-sm leading-6 text-slate-400 mb-6">
                Making school supplies accessible to everyone in Tanzania.
              </p>
              <div className="flex gap-3">
                <a href="mailto:hello@shuleyetu.com" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 transition-all duration-300 hover:border-sky-400/30 hover:bg-sky-500 hover:text-white" aria-label="Email us">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
                <a href="/contact" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 transition-all duration-300 hover:border-sky-400/30 hover:bg-sky-500 hover:text-white" aria-label="Contact us">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-50 mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/vendors" className="text-slate-400 hover:text-sky-400 transition-colors">
                    Browse Vendors
                  </Link>
                </li>
                <li>
                  <Link href="/orders/new" className="text-slate-400 hover:text-sky-400 transition-colors">
                    Create Order
                  </Link>
                </li>
                <li>
                  <Link href="/why-shuleyetu" className="text-slate-400 hover:text-sky-400 transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-slate-400 hover:text-sky-400 transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/schools/portal" className="text-slate-400 hover:text-sky-400 transition-colors">
                    School Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-50 mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/why-shuleyetu" className="text-slate-400 hover:text-sky-400 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-slate-400 hover:text-sky-400 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-400 hover:text-sky-400 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-400 hover:text-sky-400 transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-50 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/privacy" className="text-slate-400 hover:text-sky-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-400 hover:text-sky-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-slate-400 hover:text-sky-400 transition-colors">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-400 hover:text-sky-400 transition-colors">
                    Disclaimer
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-slate-400 md:flex-row md:items-center md:justify-between md:text-sm">
            <p>© {currentYear} Shuleyetu. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-sky-300/80">
                Tanzania-first commerce
              </span>
              <p>Made with ❤️ for Tanzania&apos;s education</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
