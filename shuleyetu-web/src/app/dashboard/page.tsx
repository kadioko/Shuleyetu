"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { StatCard, LineChart, PieChart } from "@/components/ui/Chart";
import { EmptyOrders } from "@/components/ui/EmptyState";
import { getWorkspaceSummary } from "@/lib/workspaces";

type VendorMapping = {
  vendor_id: string;
  vendors?: {
    name: string | null;
    approval_status?: "pending" | "approved" | "rejected" | null;
  }[] | null;
};

type RecentOrder = {
  id: string;
  created_at: string;
  total_amount_tzs: number;
  status: string;
  payment_status: string;
  customer_name: string | null;
};

type Analytics = {
  totalSales: number;
  paidOrders: number;
  pendingOrders: number;
  completedOrders: number;
};



export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [hasSchoolOnlyAccess, setHasSchoolOnlyAccess] = useState(false);
  const [vendor, setVendor] = useState<VendorMapping | null>(null);
  const [inventoryCount, setInventoryCount] = useState<number | null>(null);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalSales: 0,
    paidOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setIsDemoMode(false);
      setHasSchoolOnlyAccess(false);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError) {
          console.error('Error getting user', userError);
          setError('Failed to load user.');
          return;
        }

        if (!user) {
          router.push("/auth/vendor-login?next=/dashboard");
          return;
        }

        const { data: mapping, error: mapError } = await supabaseClient
          .from('vendor_users')
          .select('vendor_id, vendors(name, approval_status)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (mapError) {
          console.error('Error loading vendor mapping', mapError);
          setError('Failed to load vendor mapping.');
          return;
        }

        if (!mapping) {
          const { data: summary } = await getWorkspaceSummary();
          if (summary?.hasSchool && !summary.hasVendor) {
            setHasSchoolOnlyAccess(true);
            setLoading(false);
            return;
          }
          setIsDemoMode(true);
          setLoading(false);
          return;
        }

        setVendor(mapping as unknown as VendorMapping);

        const vendorId = mapping.vendor_id;

        const [
          { count: invCount },
          { count: ordCount },
          { data: orders },
          { data: recentOrd },
        ] = await Promise.all([
          supabaseClient
            .from('inventory')
            .select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendorId),
          supabaseClient
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendorId),
          supabaseClient
            .from('orders')
            .select('total_amount_tzs, status, payment_status')
            .eq('vendor_id', vendorId),
          supabaseClient
            .from('orders')
            .select('id, created_at, total_amount_tzs, status, payment_status, customer_name')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        setInventoryCount(invCount ?? 0);
        setOrdersCount(ordCount ?? 0);
        setRecentOrders((recentOrd as RecentOrder[]) ?? []);

        // Calculate analytics
        if (orders) {
          const totalSales = orders
            .filter((o) => o.payment_status === 'paid')
            .reduce((sum, o) => sum + (o.total_amount_tzs || 0), 0);
          const paidOrders = orders.filter((o) => o.payment_status === 'paid').length;
          const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'awaiting_payment').length;
          const completedOrders = orders.filter((o) => o.status === 'completed').length;

          setAnalytics({ totalSales, paidOrders, pendingOrders, completedOrders });
        }
      } catch (err) {
        console.error('Unexpected error loading dashboard', err);
        setError('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col">
        <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
            <div className="h-5 w-28 rounded-full bg-slate-800 animate-pulse mb-4" />
            <div className="h-9 w-56 rounded-lg bg-slate-800 animate-pulse mb-2" />
            <div className="h-4 w-40 rounded bg-slate-800/60 animate-pulse" />
          </div>
        </section>
        <div className="mx-auto max-w-6xl w-full px-4 py-8 md:px-6 flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl border border-slate-800 bg-slate-900/40 animate-pulse" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl border border-slate-800 bg-slate-900/40 animate-pulse" />
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
            <p className="text-lg font-bold text-red-200">Dashboard error</p>
            <p className="mt-1 text-sm text-red-300/70">{error}</p>
          </div>
          <Link href="/auth/vendor-login?next=/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-5 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/30">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Go to vendor login
          </Link>
        </div>
      </main>
    );
  }

  if (isDemoMode) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-500/10 text-sky-400">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">No vendor account yet</h1>
            <p className="mt-2 text-slate-400">
              Your account is not linked to a vendor store. Complete onboarding to start managing inventory, viewing orders, and tracking revenue.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/vendor/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Set up your vendor store
            </Link>
            <Link
              href="/vendors"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-semibold text-slate-300 transition-all hover:border-slate-600 hover:text-white"
            >
              Browse as customer
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            If you believe this is an error, contact an admin to link your account to a vendor.
          </p>
        </div>
      </main>
    );
  }

  if (hasSchoolOnlyAccess) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-300">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0118.5 17.25c0 1.01-.672 1.9-1.646 2.171A18.487 18.487 0 0112 20a18.487 18.487 0 01-4.854-.579A2.25 2.25 0 015.5 17.25c0-2.35.67-4.55 1.84-6.672L12 14z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">
              This account is linked to a school, not a vendor store
            </h1>
            <p className="mt-2 text-slate-400">
              Vendor tools are only available to accounts linked in vendor users. Continue to the school portal or ask an admin to link your account to a vendor store.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/schools/portal"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
            >
              Open school portal
            </Link>
            <Link
              href="/auth/vendor-login?next=/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-semibold text-slate-300 transition-all hover:border-slate-600 hover:text-white"
            >
              Use another account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const vendorName = vendor?.vendors?.[0]?.name ?? 'Your vendor';
  const approvalStatus = vendor?.vendors?.[0]?.approval_status ?? "approved";

  if (approvalStatus !== "approved") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-300">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">
              {approvalStatus === "rejected"
                ? "Your vendor profile needs review"
                : "Your vendor profile is under review"}
            </h1>
            <p className="mt-2 text-slate-400">
              {approvalStatus === "rejected"
                ? "An admin rejected or paused this vendor profile. Contact Shuleyetu support to resolve it."
                : "An admin needs to approve your vendor profile before you can publish inventory and receive orders."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
            >
              Contact support
            </Link>
            <Link
              href="/vendors"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-semibold text-slate-300 transition-all hover:border-slate-600 hover:text-white"
            >
              Browse public marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-TZ') + ' TZS';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-TZ', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400';
      case 'paid': return 'text-emerald-400';
      case 'processing': return 'text-sky-400';
      case 'shipped': return 'text-sky-400';
      case 'pending': return 'text-amber-400';
      case 'awaiting_payment': return 'text-amber-400';
      case 'cancelled': return 'text-red-400';
      case 'failed': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const pendingActionCount = analytics.pendingOrders;

  return (
    <main className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 mb-3">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span>
                Live Dashboard
              </div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl">Vendor Dashboard</h1>
              <p className="mt-2 text-base text-slate-400">Welcome back, <span className="font-semibold text-slate-200">{vendorName}</span></p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Store health</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">{ordersCount ?? 0} orders tracked</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Revenue snapshot</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">{formatCurrency(analytics.totalSales)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Needs attention</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">{pendingActionCount} open follow-ups</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/inventory/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add Item
              </Link>
              <Link href="/dashboard/orders" className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900/50 px-5 py-2.5 text-sm font-bold text-slate-300 transition-all hover:border-slate-600 hover:text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl w-full px-4 py-8 md:px-6 flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(analytics.totalSales)}
          change={12.5}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Paid Orders"
          value={analytics.paidOrders}
          change={8.2}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Pending Orders"
          value={analytics.pendingOrders}
          change={-3.1}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Completed Orders"
          value={analytics.completedOrders}
          change={15.3}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          }
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/inventory"
          className="surface-panel group rounded-3xl p-5 transition-all hover:border-sky-500/30"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Inventory</p>
            <svg className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-50">
            {inventoryCount ?? '—'}
          </p>
          <p className="mt-1 text-xs text-slate-400">Active items in your store</p>
        </Link>

        <Link
          href="/dashboard/orders"
          className="surface-panel group rounded-3xl p-5 transition-all hover:border-sky-500/30"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Orders</p>
            <svg className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-50">
            {ordersCount ?? '—'}
          </p>
          <p className="mt-1 text-xs text-slate-400">All-time orders received</p>
        </Link>

        <Link
          href="/dashboard/inventory/new"
          className="surface-panel group rounded-3xl border-dashed p-5 transition-all hover:border-sky-500/30"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Quick Action</p>
            <svg className="h-4 w-4 text-slate-400 transition-transform group-hover:rotate-90 group-hover:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-200">Add New Item</p>
          <p className="mt-1 text-xs text-slate-400">Add products to your inventory</p>
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface-panel rounded-3xl p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-50">Sales Overview</h3>
              <p className="mt-1 text-sm text-slate-400">A simple monthly trend snapshot for your store performance.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Last 6 months</span>
          </div>
          <div className="flex justify-center">
            <LineChart 
              data={[
                { label: 'Jan', value: 45000 },
                { label: 'Feb', value: 52000 },
                { label: 'Mar', value: 48000 },
                { label: 'Apr', value: 61000 },
                { label: 'May', value: 58000 },
                { label: 'Jun', value: 67000 },
              ]}
              width={350}
              height={200}
            />
          </div>
        </div>

        <div className="surface-panel rounded-3xl p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-50">Order Status</h3>
              <p className="mt-1 text-sm text-slate-400">How current order activity is distributed across key fulfillment states.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Live mix</span>
          </div>
          <div className="flex justify-center">
            <PieChart 
              data={[
                { label: 'Paid', value: analytics.paidOrders },
                { label: 'Pending', value: analytics.pendingOrders },
                { label: 'Completed', value: analytics.completedOrders },
              ]}
              width={200}
              height={200}
            />
          </div>
        </div>
      </section>

      <section className="surface-panel rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-50">Recent Orders</h2>
          <Link
            href="/dashboard/orders"
            className="text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-8">
            <EmptyOrders />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-slate-400">
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Payment</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5">
                    <td className="py-4 text-slate-200">{order.customer_name || 'Anonymous'}</td>
                    <td className="py-3 font-medium text-slate-100">{formatCurrency(order.total_amount_tzs)}</td>
                    <td className="py-3">
                      <span className={`inline-flex rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium capitalize ${getStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: `/vendors/${vendor?.vendor_id}`, label: 'View Public Page', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
          { href: '/orders/track', label: 'Track Order', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
          { href: '/dashboard/inventory', label: 'Manage Inventory', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
          { href: '/dashboard/orders', label: 'View All Orders', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
          { href: '/dashboard/analytics', label: 'Analytics', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="surface-panel group flex items-center gap-3 rounded-3xl p-4 text-sm font-medium transition-all duration-200 hover:border-sky-500/30 hover:-translate-y-0.5">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 transition-colors group-hover:bg-sky-500/10 group-hover:text-sky-400">{link.icon}</span>
            <span className="text-slate-300 group-hover:text-slate-100 transition-colors">{link.label}</span>
            <svg className="ml-auto h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        ))}
      </section>
      </div>
    </main>
  );
}
