"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { isUuid, parseOrderLink } from "@/lib/orderTracking";

export default function TrackOrderPage() {
  const router = useRouter();

  const [shareLink, setShareLink] = useState("");
  const [orderId, setOrderId] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseOrderLink(shareLink), [shareLink]);

  const resolved = useMemo(() => {
    const id = (parsed?.orderId ?? orderId).trim();
    const tok = (parsed?.token ?? token).trim();
    return { orderId: id, token: tok };
  }, [orderId, parsed, token]);

  const isReady = useMemo(() => {
    if (!resolved.orderId || !resolved.token) return false;
    return isUuid(resolved.orderId) && isUuid(resolved.token);
  }, [resolved.orderId, resolved.token]);

  const validate = (): boolean => {
    const id = resolved.orderId;
    const tok = resolved.token;

    if (!id || !tok) {
      setError("Please paste the share link or enter both Order ID and Token.");
      return false;
    }

    if (!isUuid(id)) {
      setError("Order ID must be a valid UUID.");
      return false;
    }

    if (!isUuid(tok)) {
      setError("Token must be a valid UUID.");
      return false;
    }

    setError(null);
    return true;
  };

  const goToSummary = () => {
    if (!validate()) return;
    router.push(`/orders/${resolved.orderId}?token=${encodeURIComponent(resolved.token)}`);
  };

  const goToPay = () => {
    if (!validate()) return;
    router.push(
      `/orders/pay/${resolved.orderId}?token=${encodeURIComponent(resolved.token)}`,
    );
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
      <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="absolute bottom-20 left-10 h-64 w-64 rounded-full bg-sky-600/10 blur-3xl" />

      <div className="relative w-full max-w-lg">
        {/* Logo/Brand */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3 text-2xl font-bold text-slate-50 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-xl font-extrabold text-white shadow-lg shadow-sky-500/30 transition-transform group-hover:scale-110">S</div>
            <span className="font-display">Shuleyetu</span>
          </Link>
          <p className="mt-3 text-sm text-slate-400">Order Tracking</p>
        </div>

        {/* Track Order Card */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/80 backdrop-blur-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-50">Track Your Order</h1>
            <p className="mt-2 text-sm text-slate-400">Enter your order details to check status and payment</p>
          </div>

          <div className="space-y-5">
            {/* Share Link Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Shareable order link</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <input
                  value={shareLink}
                  onChange={(e) => { setShareLink(e.target.value); setError(null); }}
                  placeholder="https://shuleyetu.co.tz/orders/..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              {parsed && (
                <p className="flex items-center gap-2 text-xs text-emerald-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Order details detected from link
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/60"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900/80 px-3 text-slate-400 font-medium">OR ENTER MANUALLY</span>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Order ID</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <input
                    value={orderId}
                    onChange={(e) => { setOrderId(e.target.value); setError(null); }}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Access Token</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    value={token}
                    onChange={(e) => { setToken(e.target.value); setError(null); }}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {!error && !isReady && (
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40 p-3.5">
                <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-slate-400">Paste your share link or enter the Order ID and Token to continue</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4">
                <svg className="h-5 w-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={goToSummary}
                disabled={!isReady}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-sky-400/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View Order Details
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </button>

              <button
                type="button"
                onClick={goToPay}
                disabled={!isReady}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 px-4 py-3.5 text-sm font-bold text-emerald-400 transition-all duration-300 hover:border-emerald-500/60 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/50 disabled:text-slate-400 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Pay with ClickPesa
              </button>
            </div>
          </div>
        </div>

        {/* Help Info */}
        <div className="mt-6 rounded-xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5 text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-xs text-slate-400">
              <p className="font-semibold text-slate-300">Need help?</p>
              <p className="mt-1 leading-relaxed">After placing an order, you&apos;ll receive a shareable link. Keep it safe to track your order status and make payments.</p>
              <Link href="/orders/new" className="mt-2 inline-flex items-center gap-1.5 font-medium text-sky-400 hover:text-sky-300 transition-colors">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Create a new order
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-sky-400 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
