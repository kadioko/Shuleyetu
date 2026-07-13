'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cartContext';

export function CartDrawer() {
  const { items, vendorName, totalAmount, totalItems, isOpen, setIsOpen, updateQuantity, removeItem, vendorId } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        role="presentation"
        aria-hidden="true"
      />
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-2xl"
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Your Cart</h2>
            {vendorName && <p className="text-xs text-slate-400">from {vendorName}</p>}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-800 p-4 text-slate-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="mt-4 font-medium text-slate-300">Your cart is empty</p>
              <p className="mt-1 text-sm text-slate-400">Browse vendors and add items to get started.</p>
              <Link
                href="/vendors"
                onClick={() => setIsOpen(false)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105"
              >
                Browse Vendors
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.itemId} className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                  {item.image_url ? (
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-800">
                      <Image src={item.image_url} alt={item.name} fill sizes="64px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">{item.name}</p>
                    <p className="mt-1 text-sm text-sky-400">{item.price_tzs.toLocaleString('en-TZ')} TZS</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                        aria-label="Decrease quantity"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-slate-200">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                        aria-label="Increase quantity"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.itemId)}
                    className="self-start rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Remove item"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-800 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">Total ({totalItems} items)</span>
              <span className="text-lg font-bold text-sky-400">{totalAmount.toLocaleString('en-TZ')} TZS</span>
            </div>
            <Link
              href={`/orders/new?vendor=${vendorId}`}
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02]"
            >
              Proceed to Checkout
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
