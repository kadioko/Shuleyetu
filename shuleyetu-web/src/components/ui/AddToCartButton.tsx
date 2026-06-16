'use client';

import { useCart } from '@/lib/cartContext';

interface AddToCartButtonProps {
  itemId: string;
  vendorId: string;
  vendorName: string;
  name: string;
  price_tzs: number;
  image_url: string | null;
  stock_quantity: number;
}

export function AddToCartButton({
  itemId,
  vendorId,
  vendorName,
  name,
  price_tzs,
  image_url,
  stock_quantity,
}: AddToCartButtonProps) {
  const { addItem, items } = useCart();

  const inCart = items.find((i) => i.itemId === itemId);
  const quantity = inCart?.quantity ?? 0;

  const handleAdd = () => {
    if (stock_quantity <= 0) return;
    addItem({
      itemId,
      vendorId,
      vendorName,
      name,
      price_tzs,
      image_url,
    });
  };

  return (
    <button
      onClick={handleAdd}
      disabled={stock_quantity <= 0}
      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-400 transition-all hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      {quantity > 0 ? `Add more (${quantity})` : 'Add to cart'}
    </button>
  );
}
