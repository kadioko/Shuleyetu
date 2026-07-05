'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { VendorCardSkeleton } from '@/components/ui/SkeletonLoader';

type Vendor = {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  district: string | null;
  ward: string | null;
};

const DEMO_VENDORS: Vendor[] = [
  {
    id: "demo-vendor-1",
    name: "Mlimani School Supplies",
    description: "Affordable textbooks, exercise books, and exam prep materials.",
    region: "Dar es Salaam",
    district: "Kinondoni",
    ward: "Msasani",
  },
  {
    id: "demo-vendor-2",
    name: "Uhuru Uniform Center",
    description: "Quality school uniforms, shoes, and sports wear for all levels.",
    region: "Arusha",
    district: "Arusha Urban",
    ward: "Kaloleni",
  },
  {
    id: "demo-vendor-3",
    name: "Twiga Stationery Hub",
    description: "Pens, geometry sets, backpacks, and daily school essentials.",
    region: "Mwanza",
    district: "Nyamagana",
    ward: "Pamba",
  },
];

function VendorsInner() {
  const searchParams = useSearchParams();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showingDemo, setShowingDemo] = useState(false);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(
    () => searchParams?.get('category') ?? '',
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setShowingDemo(false);

      try {
        const { data, error } = await supabaseClient
          .from('vendors')
          .select('id, name, description, region, district, ward')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading vendors', error);
          setVendors(DEMO_VENDORS);
          setShowingDemo(true);
          setError(null);
          return;
        }

        const loadedVendors = (data as Vendor[]) ?? [];
        if (loadedVendors.length === 0) {
          setVendors(DEMO_VENDORS);
          setShowingDemo(true);
        } else {
          setVendors(loadedVendors);
        }
      } catch (err) {
        console.error('Unexpected error loading vendors', err);
        setVendors(DEMO_VENDORS);
        setShowingDemo(true);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const v of vendors) {
      if (v.region && v.region.trim().length > 0) {
        set.add(v.region.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    const term = search.trim().toLowerCase();

    return vendors.filter((v) => {
      if (regionFilter && v.region?.trim() !== regionFilter) return false;

      if (!term) return true;

      const haystack = [
        v.name,
        v.description ?? '',
        v.region ?? '',
        v.district ?? '',
        v.ward ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [vendors, search, regionFilter]);

  const clearFilters = () => {
    setSearch('');
    setRegionFilter('');
    setCategoryFilter('');
  };

  const hasFilters = search.trim() !== '' || regionFilter !== '' || categoryFilter !== '';

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl">Find Vendors</h1>
              <p className="mt-2 text-base text-slate-400">
                {loading ? 'Loading vendors…' : <><span className="font-semibold text-slate-200">{vendors.length}</span> school supply vendors across Tanzania</>}
              </p>
            </div>
            <Link href="/orders/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Create Order
            </Link>
          </div>

          {!loading && (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Available vendors</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">{vendors.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Regions covered</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">{regions.length || 1}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Current results</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">{filteredVendors.length}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl w-full px-4 py-8 md:px-6 flex flex-col gap-6">
      {showingDemo && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Demo mode: these are sample vendors to help you test browsing and ordering flows.
        </section>
      )}

      {categoryFilter && (
        <section className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-sky-200">
                Showing vendors for: <span className="capitalize">{categoryFilter}</span>
              </p>
              <p className="mt-0.5 text-xs text-sky-300/70">
                Browse the vendors below and open each one to see their {categoryFilter} products.
              </p>
            </div>
            <button
              onClick={() => setCategoryFilter('')}
              className="flex-shrink-0 rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/20 transition-colors"
            >
              Clear
            </button>
          </div>
        </section>
      )}

      <section className="surface-panel space-y-4 rounded-3xl p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">
              Search vendors
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, location..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-50 placeholder-slate-500 outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
              />

              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="w-full space-y-1.5 md:w-48">
            <label className="block text-xs font-medium text-slate-400">
              Region
            </label>
            <select
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-3 text-sm text-slate-50 outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
            >
              <option value="">All regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <p className="text-xs text-slate-400">
            {loading ? (
              'Loading vendors...'
            ) : (
              <>
                Showing <span className="font-medium text-slate-300">{filteredVendors.length}</span> of{' '}
                <span className="font-medium text-slate-300">{vendors.length}</span> vendors
              </>
            )}
          </p>
          {hasFilters && filteredVendors.length === 0 && !loading && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-sky-400 hover:text-sky-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Vendors Grid */}
      {loading ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <VendorCardSkeleton key={index} />
          ))}
        </section>
      ) : error ? (
        <div className="surface-panel flex flex-col items-center gap-4 rounded-3xl border border-red-500/30 bg-red-950/20 p-8 text-center">
          <div className="rounded-full bg-red-500/10 p-3 text-red-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-red-200">{error}</p>
            <p className="mt-1 text-sm text-red-300/70">Please try again later or contact support.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/30"
          >
            Try again
          </button>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="surface-panel flex flex-col items-center gap-4 rounded-3xl border-dashed p-12 text-center">
          <div className="rounded-full bg-slate-800 p-4 text-slate-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-slate-300">No vendors found</p>
            <p className="mt-1 text-sm text-slate-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
          <button
            onClick={clearFilters}
            className="rounded-2xl bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-400 transition-colors hover:bg-sky-500/20"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.id}`}
              className="surface-panel group flex flex-col rounded-3xl p-5 transition-all hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/20 to-emerald-500/20 text-lg font-bold text-sky-300">
                  {vendor.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-slate-50 group-hover:text-sky-400 transition-colors">
                    {vendor.name}
                  </h2>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">
                      {vendor.region || 'Tanzania'}
                    </span>
                  </div>
                </div>
              </div>

              {vendor.description && (
                <p className="mt-3 line-clamp-2 text-sm text-slate-400">
                  {vendor.description}
                </p>
              )}

              {(vendor.district || vendor.ward) && (
                <p className="mt-3 inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                  {[vendor.district, vendor.ward].filter(Boolean).join(' · ')}
                </p>
              )}

              <div className="mt-auto pt-4">
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition-all group-hover:border-sky-500/30 group-hover:bg-sky-500/10 group-hover:text-sky-400">
                  View Products
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}

      {!loading && vendors.length > 0 && (
        <section className="surface-panel flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-r from-slate-900/50 to-slate-900/30 p-6 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-200">Can&apos;t find what you&apos;re looking for?</h3>
            <p className="mt-1 text-sm text-slate-400">
              Create an order and we&apos;ll help you find the right vendor.
            </p>
          </div>
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Order
          </Link>
        </section>
      )}
    </div>
    </main>
  );
}

export default function VendorsPage() {
  return (
    <Suspense>
      <VendorsInner />
    </Suspense>
  );
}