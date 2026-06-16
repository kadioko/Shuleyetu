'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { BarChart, LineChart, PieChart, StatCard } from '@/components/ui/Chart';

interface OrderRow {
  id: string;
  total_amount_tzs: number;
  status: string;
  payment_status: string;
  created_at: string;
}

type Period = '7d' | '30d' | '90d' | 'all';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [period, setPeriod] = useState<Period>('30d');
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: mapping } = await supabaseClient
          .from('vendor_users')
          .select('vendor_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!mapping) {
          setError('No vendor linked to this account.');
          setLoading(false);
          return;
        }

        setVendorId(mapping.vendor_id);

        const { data, error: ordersError } = await supabaseClient
          .from('orders')
          .select('id, total_amount_tzs, status, payment_status, created_at')
          .eq('vendor_id', mapping.vendor_id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(data ?? []);
      } catch (err) {
        console.error('Error loading analytics', err);
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return orders.filter((o) => new Date(o.created_at) >= cutoff);
  }, [orders, period]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders
      .filter((o) => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.total_amount_tzs || 0), 0);

    const totalOrders = filteredOrders.length;
    const paidOrders = filteredOrders.filter((o) => o.payment_status === 'paid').length;
    const pendingOrders = filteredOrders.filter((o) => o.status === 'pending' || o.status === 'awaiting_payment').length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return { totalRevenue, totalOrders, paidOrders, pendingOrders, avgOrderValue };
  }, [filteredOrders]);

  const salesTrend = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredOrders.forEach((o) => {
      const date = new Date(o.created_at).toLocaleDateString('en-TZ', { month: 'short', day: 'numeric' });
      const current = grouped.get(date) || 0;
      grouped.set(date, current + (o.payment_status === 'paid' ? o.total_amount_tzs : 0));
    });
    // Take last 7 distinct dates
    const entries = Array.from(grouped.entries()).slice(-7);
    return entries.map(([label, value]) => ({ label, value: Math.round(value / 1000) })); // in thousands
  }, [filteredOrders]);

  const statusDistribution = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredOrders.forEach((o) => {
      const current = grouped.get(o.status) || 0;
      grouped.set(o.status, current + 1);
    });
    return Array.from(grouped.entries()).map(([label, value]) => ({ label, value }));
  }, [filteredOrders]);

  const paymentDistribution = useMemo(() => {
    const paid = filteredOrders.filter((o) => o.payment_status === 'paid').length;
    const unpaid = filteredOrders.filter((o) => o.payment_status === 'unpaid').length;
    const pending = filteredOrders.filter((o) => o.payment_status === 'pending').length;
    const failed = filteredOrders.filter((o) => o.payment_status === 'failed').length;
    return [
      { label: 'Paid', value: paid },
      { label: 'Unpaid', value: unpaid },
      { label: 'Pending', value: pending },
      { label: 'Failed', value: failed },
    ].filter((d) => d.value > 0);
  }, [filteredOrders]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-3 py-8 md:px-4 md:py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-800" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-3 py-8 md:px-4 md:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-xs font-medium text-sky-400 hover:text-sky-300">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-slate-400">Revenue, orders, and business insights for your vendor store.</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                period === p
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  : 'border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : p === '90d' ? 'Last 90 days' : 'All time'}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-100">{error}</p>
      )}

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={`${stats.totalRevenue.toLocaleString('en-TZ')} TZS`} icon={<svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={<svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        <StatCard title="Paid Orders" value={stats.paidOrders} icon={<svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="Avg Order Value" value={`${stats.avgOrderValue.toLocaleString('en-TZ')} TZS`} icon={<svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
      </section>

      {/* Charts */}
      {filteredOrders.length === 0 ? (
        <div className="surface-panel flex flex-col items-center gap-4 rounded-3xl border-dashed p-16 text-center">
          <div className="rounded-full bg-slate-800 p-5 text-slate-400">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-200">No data yet</p>
            <p className="mt-1 text-sm text-slate-400">Analytics will appear once you start receiving orders.</p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105">
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="surface-panel rounded-3xl p-6">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Sales Trend (TZS thousands)</h2>
            {salesTrend.length > 1 ? (
              <LineChart data={salesTrend} width={500} height={220} />
            ) : (
              <p className="text-sm text-slate-400">Not enough data points for a trend.</p>
            )}
          </section>

          <section className="surface-panel rounded-3xl p-6">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Payment Status</h2>
            {paymentDistribution.length > 0 ? (
              <PieChart data={paymentDistribution} width={220} height={220} />
            ) : (
              <p className="text-sm text-slate-400">No payment data yet.</p>
            )}
          </section>

          <section className="surface-panel rounded-3xl p-6">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Order Status Breakdown</h2>
            {statusDistribution.length > 0 ? (
              <BarChart data={statusDistribution} width={500} height={220} />
            ) : (
              <p className="text-sm text-slate-400">No status data yet.</p>
            )}
          </section>

          <section className="surface-panel rounded-3xl p-6">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Key Insights</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                <span className="text-sm text-slate-300">Conversion rate</span>
                <span className="text-sm font-bold text-sky-400">
                  {stats.totalOrders > 0 ? Math.round((stats.paidOrders / stats.totalOrders) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                <span className="text-sm text-slate-300">Pending attention</span>
                <span className="text-sm font-bold text-amber-400">{stats.pendingOrders} orders</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                <span className="text-sm text-slate-300">Period total</span>
                <span className="text-sm font-bold text-emerald-400">{filteredOrders.length} orders</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
