'use client';

import { useCart } from '@/lib/cartContext';

export function CartButton() {
  const { totalItems, setIsOpen } = useCart();

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition-all hover:border-sky-400/30 hover:bg-white/10 hover:text-white"
      aria-label={`Open cart (${totalItems} items)`}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-slate-950 shadow-lg shadow-sky-500/30">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </button>
  );
}
