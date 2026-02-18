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
    <footer className="border-t border-slate-800 bg-gradient-to-b from-slate-950 to-slate-950/50 safe-area-bottom">
      {/* Newsletter Section */}
      <div className="border-b border-slate-800 bg-slate-900/30 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-sky-950/50 to-slate-900/50 p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-50 md:text-3xl">
                  Stay Updated
                </h3>
                <p className="mt-2 text-slate-400">
                  Get the latest updates on new vendors, products, and exclusive offers.
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-slate-50 placeholder-slate-500 transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-sky-500/30"
                >
                  Subscribe
                </button>
              </form>
              {subscribed && (
                <p className="col-span-full text-sm text-sky-400">✓ Thank you for subscribing!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4 mb-12">
            {/* Brand */}
            <div>
              <h4 className="font-display text-lg font-bold text-slate-50 mb-4">Shuleyetu</h4>
              <p className="text-sm text-slate-400 mb-6">
                Making school supplies accessible to everyone in Tanzania.
              </p>
              <div className="flex gap-3">
                <a href="mailto:hello@shuleyetu.com" className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-slate-900 text-slate-400 hover:bg-sky-500 hover:text-white transition-all duration-300" aria-label="Email us">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
                <a href="/contact" className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-slate-900 text-slate-400 hover:bg-sky-500 hover:text-white transition-all duration-300" aria-label="Contact us">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
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
              </ul>
            </div>

            {/* Company */}
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

            {/* Legal */}
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

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm text-slate-400">
            <p>© {currentYear} Shuleyetu. All rights reserved.</p>
            <p>Made with ❤️ for Tanzania&apos;s education</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
