"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { EmptyInventory } from "@/components/ui/EmptyState";

type VendorMapping = {
  vendor_id: string;
  vendors?: {
    name: string | null;
  }[] | null;
};

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  price_tzs: number;
  stock_quantity: number;
};

export default function DashboardInventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorMapping | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError) {
        console.error('Error getting user', userError);
        setError('Failed to load user.');
        setLoading(false);
        return;
      }

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: mapping, error: mapError } = await supabaseClient
        .from('vendor_users')
        .select('vendor_id, vendors(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (mapError) {
        console.error('Error loading vendor mapping', mapError);
        setError('Failed to load vendor mapping.');
        setLoading(false);
        return;
      }

      if (!mapping) {
        setError(
          'No vendor is linked to this user. An admin must add a row in vendor_users for you.',
        );
        setLoading(false);
        return;
      }

      setVendor(mapping as unknown as VendorMapping);

      const vendorId = mapping.vendor_id;

      const { data: inventory, error: invError } = await supabaseClient
        .from('inventory')
        .select('id, name, category, price_tzs, stock_quantity')
        .eq('vendor_id', vendorId)
        .order('name', { ascending: true });

      if (invError) {
        console.error('Error loading inventory', invError);
        setError('Failed to load inventory.');
        setLoading(false);
        return;
      }

      setItems((inventory as InventoryItem[]) ?? []);
      setLoading(false);
    };

    void load();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col">
        <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
            <div className="h-4 w-24 rounded-full bg-slate-800 animate-pulse mb-3" />
            <div className="h-9 w-48 rounded-lg bg-slate-800 animate-pulse" />
          </div>
        </section>
        <div className="mx-auto max-w-6xl w-full px-4 py-8 md:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 animate-pulse">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-800" />
                  <div className="h-5 w-16 rounded-full bg-slate-800" />
                </div>
                <div className="h-4 w-32 rounded bg-slate-800 mb-2" />
                <div className="h-3 w-20 rounded bg-slate-800/60" />
                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between">
                  <div className="h-5 w-24 rounded bg-slate-800" />
                  <div className="h-4 w-16 rounded bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-500/30 bg-red-950/20 p-10 text-center max-w-md">
          <div className="rounded-full bg-red-500/10 p-4 text-red-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <p className="text-lg font-bold text-red-200">Error loading inventory</p>
            <p className="mt-1 text-sm text-red-300/70">{error}</p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-5 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/30">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const vendorName = vendor?.vendors?.[0]?.name ?? 'Your vendor';
  const inStock = items.filter((i) => i.stock_quantity > 0).length;
  const outOfStock = items.filter((i) => i.stock_quantity === 0).length;
  const categories = [...new Set(items.map((i) => i.category))];
  const totalStockUnits = items.reduce((sum, item) => sum + item.stock_quantity, 0);

  return (
    <main className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <nav className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/dashboard" className="hover:text-sky-400 transition-colors">Dashboard</Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-200">Inventory</span>
          </nav>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl">Inventory</h1>
              <p className="mt-2 text-base text-slate-400">Managing <span className="font-semibold text-slate-200">{vendorName}</span> — {items.length} items</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/inventory/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add Item
              </Link>
            </div>
          </div>
          {items.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="text-sm text-slate-300">{inStock} in stock</span>
              </div>
              {outOfStock > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-red-400"></span>
                  <span className="text-sm text-red-300">{outOfStock} out of stock</span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2">
                <span className="text-sm text-slate-300">{categories.length} {categories.length === 1 ? 'category' : 'categories'}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl w-full px-4 py-8 md:px-6">
        {items.length > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="surface-panel rounded-3xl p-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Catalog size</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-50">{items.length}</p>
              <p className="mt-2 text-sm text-slate-400">Products listed for your vendor storefront.</p>
            </div>
            <div className="surface-panel rounded-3xl p-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Stock units</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-50">{totalStockUnits.toLocaleString('en-TZ')}</p>
              <p className="mt-2 text-sm text-slate-400">Total units currently available to fulfill orders.</p>
            </div>
            <div className="surface-panel rounded-3xl p-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Healthy items</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-300">{inStock}</p>
              <p className="mt-2 text-sm text-slate-400">Products that are currently orderable.</p>
            </div>
            <div className="surface-panel rounded-3xl p-5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Categories</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-50">{categories.length}</p>
              <p className="mt-2 text-sm text-slate-400">Distinct product groups in your catalog.</p>
            </div>
          </section>
        )}

        {items.length === 0 ? (
          <div className="surface-panel flex flex-col items-center gap-4 rounded-3xl border-dashed p-16 text-center">
            <div className="rounded-full bg-slate-800 p-5 text-slate-400">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-200">No inventory yet</p>
              <p className="mt-1 text-sm text-slate-400">Add your first product to start receiving orders.</p>
            </div>
            <Link href="/dashboard/inventory/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add First Item
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="surface-panel group flex flex-col rounded-3xl p-5 transition-all duration-300 hover:border-sky-500/30 hover:shadow-[0_24px_60px_rgba(14,165,233,0.08)] hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/10 bg-sky-500/10 text-sky-300">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </div>
                  {item.stock_quantity > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>In Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>Out of Stock
                    </span>
                  )}
                </div>
                <div className="mt-4 flex-1">
                  <h3 className="font-semibold text-slate-100 group-hover:text-sky-400 transition-colors">{item.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">{item.category}</p>
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4">
                  <div>
                    <p className="text-xl font-bold text-sky-400">{item.price_tzs.toLocaleString('en-TZ')}<span className="ml-1 text-xs font-normal text-slate-400">TZS</span></p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.stock_quantity} units available</p>
                  </div>
                  <Link href={`/dashboard/inventory/${item.id}/edit`} className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-sky-500/50 hover:text-sky-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
