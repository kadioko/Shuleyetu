'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { VendorCardSkeleton } from '@/components/ui/SkeletonLoader';
import { useLanguage } from '@/components/LanguageProvider';

type Vendor = {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  district: string | null;
  ward: string | null;
  approval_status?: string | null;
  avg_rating: number;
  review_count: number;
  is_recommended?: boolean;
};

type SchoolOption = {
  id: string;
  name: string;
  region: string | null;
  district: string | null;
};

const SCHOOL_STORAGE_KEY = 'shuleyetu_selected_school';

function VendorsInner() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(
    () => searchParams?.get('category') ?? '',
  );
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const schoolsRef = useRef<SchoolOption[]>([]);
  const [schoolFilter, setSchoolFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(SCHOOL_STORAGE_KEY) ?? '';
  });
  const [recommendedIds, setRecommendedIds] = useState<Set<string>>(new Set());

  // Load schools once
  useEffect(() => {
    const loadSchools = async () => {
      const { data, error } = await supabaseClient
        .from('schools')
        .select('id, name, region, district')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) {
        console.error('Error loading schools for vendor filter', error);
        return;
      }
      const nextSchools = (data ?? []) as SchoolOption[];
      schoolsRef.current = nextSchools;
      setSchools(nextSchools);
    };
    void loadSchools();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Step 1: If category filter is set, find vendor IDs that have matching inventory
        let vendorIdFilter: string[] | null = null;
        if (categoryFilter) {
          const { data: invData, error: invError } = await supabaseClient
            .from('inventory')
            .select('vendor_id')
            .eq('category', categoryFilter);

          if (invError) {
            console.error('Error filtering by category', invError);
            setError('Failed to load vendors. Please try again later.');
            setLoading(false);
            return;
          }

          // Deduplicate vendor IDs
          const ids = [...new Set((invData ?? []).map((row) => row.vendor_id as string))];
          vendorIdFilter = ids;
        }

        // If categoryFilter is set but no vendors match, show empty state immediately
        if (vendorIdFilter !== null && vendorIdFilter.length === 0) {
          setVendors([]);
          setLoading(false);
          return;
        }

        // Step 2: Fetch recommended vendor IDs when a school is selected
        let recIds = new Set<string>();
        let selectedSchool: SchoolOption | null = null;
        if (schoolFilter) {
          selectedSchool = schoolsRef.current.find((s) => s.id === schoolFilter) ?? null;
          const { data: linkData } = await supabaseClient
            .from('school_vendor_links')
            .select('vendor_id')
            .eq('school_id', schoolFilter)
            .eq('is_recommended', true);
          recIds = new Set((linkData ?? []).map((row) => row.vendor_id as string));
        }
        setRecommendedIds(recIds);

        // Step 3: Fetch vendors. The approval_status column is available after
        // the access-workflow migration; fall back gracefully if production has
        // not applied it yet so vendors do not disappear.
        const buildVendorQuery = (includeApprovalStatus: boolean) => {
          let query = supabaseClient
            .from('vendors')
            .select(
              includeApprovalStatus
                ? 'id, name, description, region, district, ward, approval_status'
                : 'id, name, description, region, district, ward',
            )
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (includeApprovalStatus) {
            query = query.eq('approval_status', 'approved');
          }
          if (vendorIdFilter !== null) {
            query = query.in('id', vendorIdFilter);
          }
          return query;
        };

        let { data, error: vendorError } = await buildVendorQuery(true);
        const approvalColumnMissing =
          vendorError &&
          (vendorError.message?.toLowerCase().includes('approval_status') ||
            vendorError.code === '42703');

        if (approvalColumnMissing) {
          console.warn('approval_status not available yet; loading active vendors without approval filter');
          const fallback = await buildVendorQuery(false);
          data = fallback.data;
          vendorError = fallback.error;
        }

        if (vendorError) {
          console.error('Error loading vendors', vendorError);
          setError('Failed to load vendors. Please try again later.');
          setLoading(false);
          return;
        }

        const rawVendors = (data ?? []) as unknown as Omit<
          Vendor,
          'avg_rating' | 'review_count' | 'is_recommended'
        >[];

        // Step 4: Fetch all approved reviews in one query and compute stats client-side
        // This avoids the N+1 RPC pattern (2 DB calls per vendor).
        const vendorIds = rawVendors.map((v) => v.id);
        let reviewStats: { vendor_id: string; rating: number }[] | null = null;
        if (vendorIds.length > 0) {
          const { data: reviewsData, error: reviewsError } = await supabaseClient
            .from('vendor_reviews')
            .select('vendor_id, rating')
            .in('vendor_id', vendorIds)
            .eq('is_approved', true);

          if (reviewsError) {
            console.error('Error loading vendor reviews', reviewsError);
          }
          reviewStats = reviewsData ?? [];
        }

        const ratingMap = new Map<string, { sum: number; count: number }>();
        (reviewStats ?? []).forEach((r) => {
          const entry = ratingMap.get(r.vendor_id) ?? { sum: 0, count: 0 };
          entry.sum += r.rating;
          entry.count += 1;
          ratingMap.set(r.vendor_id, entry);
        });

        let enriched: Vendor[] = rawVendors.map((v) => {
          const stats = ratingMap.get(v.id);
          return {
            ...v,
            is_recommended: recIds.has(v.id),
            avg_rating: stats ? stats.sum / stats.count : 0,
            review_count: stats?.count ?? 0,
          };
        });

        // Step 5: Sort: recommended first, then by same region as selected school, then created_at
        if (selectedSchool) {
          enriched = enriched.sort((a, b) => {
            const aRec = recIds.has(a.id) ? 1 : 0;
            const bRec = recIds.has(b.id) ? 1 : 0;
            if (aRec !== bRec) return bRec - aRec;
            const aNear = a.region === selectedSchool?.region ? 1 : 0;
            const bNear = b.region === selectedSchool?.region ? 1 : 0;
            if (aNear !== bNear) return bNear - aNear;
            return 0;
          });
        }

        setVendors(enriched);
      } catch (err) {
        console.error('Unexpected error loading vendors', err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [categoryFilter, schoolFilter]);

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
    setSchoolFilter('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SCHOOL_STORAGE_KEY);
    }
  };

  const hasFilters = search.trim() !== '' || regionFilter !== '' || categoryFilter !== '' || schoolFilter !== '';

  const handleSchoolChange = (value: string) => {
    setSchoolFilter(value);
    if (typeof window !== 'undefined') {
      if (value) localStorage.setItem(SCHOOL_STORAGE_KEY, value);
      else localStorage.removeItem(SCHOOL_STORAGE_KEY);
    }
  };

  const selectedSchoolName = useMemo(() => {
    return schools.find((s) => s.id === schoolFilter)?.name ?? '';
  }, [schools, schoolFilter]);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl">{t('vendorsTitle')}</h1>
              <p className="mt-2 text-base text-slate-400">
                {loading ? 'Loading vendors…' : <>{t('vendorsSubtitle').replace('{count}', String(vendors.length))}</>}
              </p>
            </div>
            <Link href="/orders/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              {t('createOrder')}
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

      {schoolFilter && selectedSchoolName && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-200">
                {t('vendorsRecommendedFor').replace('{school}', selectedSchoolName)}
              </p>
              <p className="mt-0.5 text-xs text-amber-300/70">
                {t('vendorsRecommendedSubtitle')}
              </p>
            </div>
            <button
              onClick={() => handleSchoolChange('')}
              className="flex-shrink-0 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
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

          <div className="w-full space-y-1.5 md:w-56">
            <label className="block text-xs font-medium text-slate-400">
              {t('vendorsSchoolLabel')}
            </label>
            <select
              value={schoolFilter}
              onChange={(event) => handleSchoolChange(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-3 text-sm text-slate-50 outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
            >
              <option value="">{t('vendorsAllSchools')}</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
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
      ) : vendors.length === 0 && !hasFilters ? (
        /* Empty DB — no vendors exist yet */
        <div className="surface-panel flex flex-col items-center gap-4 rounded-3xl border-dashed p-12 text-center">
          <div className="rounded-full bg-slate-800 p-5 text-slate-400">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-200">No vendors yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Vendors are being onboarded. Check back soon!
            </p>
          </div>
        </div>
      ) : filteredVendors.length === 0 ? (
        /* Filters returned no matches */
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
              prefetch={false}
              className="surface-panel group flex flex-col rounded-3xl p-5 transition-all hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/20 to-emerald-500/20 text-lg font-bold text-sky-300">
                  {vendor.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-slate-50 group-hover:text-sky-400 transition-colors">
                      {vendor.name}
                    </h2>
                    {vendor.approval_status === 'approved' && (
                      <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                        <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                    {vendor.is_recommended && (
                      <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/30">
                        <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {t('vendorsSchoolApproved')}
                      </span>
                    )}
                  </div>
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

              {/* Star rating */}
              {vendor.avg_rating > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium">{vendor.avg_rating.toFixed(1)}</span>
                  <span className="text-slate-500">({vendor.review_count})</span>
                </div>
              )}

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
      </div>
    </main>
  );
}

export default function VendorsPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col">
        <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
            <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-800" />
          </div>
        </section>
        <div className="mx-auto max-w-6xl w-full px-4 py-8 md:px-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <VendorCardSkeleton key={i} />
            ))}
          </section>
        </div>
      </main>
    }>
      <VendorsInner />
    </Suspense>
  );
}
