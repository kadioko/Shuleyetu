'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { BarChart, LineChart, PieChart, StatCard } from '@/components/ui/Chart';
import { analyticsService } from '@/lib/analytics';
import { forecastingService } from '@/lib/forecasting';

interface OrderRow {
  id: string;
  total_amount_tzs: number;
  status: string;
  payment_status: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
}

interface InventoryRow {
  id: string;
  name: string;
  stock_quantity: number;
  price_tzs: number;
}

type Period = '7d' | '30d' | '90d' | 'all';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
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
          router.push('/auth/vendor-login?next=/dashboard/analytics');
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

        const [
          { data: ordersData, error: ordersError },
          { data: invData, error: invError },
        ] = await Promise.all([
          supabaseClient
            .from('orders')
            .select('id, total_amount_tzs, status, payment_status, created_at, customer_name, customer_phone')
            .eq('vendor_id', mapping.vendor_id)
            .order('created_at', { ascending: false }),
          supabaseClient
            .from('inventory')
            .select('id, name, stock_quantity, price_tzs')
            .eq('vendor_id', mapping.vendor_id),
        ]);

        if (ordersError) throw ordersError;
        if (invError) throw invError;
        setOrders(ordersData ?? []);
        setInventory(invData ?? []);
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

  // --- Advanced analytics from lib ---
  const customerMetrics = useMemo(
    () => analyticsService.calculateCustomerMetrics(filteredOrders),
    [filteredOrders],
  );

  const inventoryMetrics = useMemo(
    () => analyticsService.calculateInventoryMetrics(inventory),
    [inventory],
  );

  const report = useMemo(() => {
    if (filteredOrders.length === 0) return null;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 3650;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    return analyticsService.generateReport(orders, inventory, startDate, endDate);
  }, [orders, inventory, filteredOrders.length, period]);

  const inventoryForecast = useMemo(
    () => (inventory.length > 0 ? forecastingService.generateForecast(inventory, []) : null),
    [inventory],
  );

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
              {report && (
                <>
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    <span className="text-sm text-slate-300">Period growth</span>
                    <span className={`text-sm font-bold ${report.summary.growthRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {report.summary.growthRate >= 0 ? '+' : ''}{report.summary.growthRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    <span className="text-sm text-slate-300">Next 30-day forecast</span>
                    <span className="text-sm font-bold text-sky-400">
                      {Math.round(report.summary.forecast.nextMonth).toLocaleString('en-TZ')} TZS
                    </span>
                  </div>
                  {report.summary.bestDay.date && (
                    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                      <span className="text-sm text-slate-300">Best day</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {report.summary.bestDay.date} &mdash; {report.summary.bestDay.sales.toLocaleString('en-TZ')} TZS
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Customer Metrics */}
      {customerMetrics.totalCustomers > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Customer Insights</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Unique Customers" value={customerMetrics.totalCustomers} icon={<svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            <StatCard title="Repeat Customers" value={customerMetrics.repeatCustomers} icon={<svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>} />
            <StatCard title="Repeat Rate" value={`${customerMetrics.repeatRate.toFixed(1)}%`} icon={<svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
            <StatCard title="Avg Customer Value" value={`${Math.round(customerMetrics.averageCustomerValue).toLocaleString('en-TZ')} TZS`} icon={<svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          </div>
          {customerMetrics.topCustomers.length > 0 && (
            <div className="mt-4 surface-panel rounded-3xl p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Top Customers</h3>
              <div className="space-y-2">
                {customerMetrics.topCustomers.map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    <span className="text-sm text-slate-200">{c.name || 'Unknown'}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400">{c.orders} order{c.orders === 1 ? '' : 's'}</span>
                      <span className="text-sm font-bold text-emerald-400">{c.totalSpent.toLocaleString('en-TZ')} TZS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Inventory Health + Forecast */}
      {inventory.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Inventory Health</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Items" value={inventoryMetrics.totalItems} icon={<svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
            <StatCard title="Low Stock" value={inventoryMetrics.lowStockItems} icon={<svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
            <StatCard title="Out of Stock" value={inventoryMetrics.outOfStockItems} icon={<svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>} />
            <StatCard title="Avg Stock Level" value={inventoryMetrics.averageStockLevel.toFixed(0)} icon={<svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
          </div>
          {inventoryForecast && inventoryForecast.summary.itemsAtRisk > 0 && (
            <div className="mt-4 surface-panel rounded-3xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Reorder Forecast</h3>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                  {inventoryForecast.summary.itemsAtRisk} item{inventoryForecast.summary.itemsAtRisk === 1 ? '' : 's'} at risk
                </span>
              </div>
              <div className="space-y-2">
                {inventoryForecast.items
                  .filter((f) => f.daysUntilStockout < 30)
                  .slice(0, 5)
                  .map((f) => (
                    <div key={f.itemId} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                      <div>
                        <span className="text-sm text-slate-200">{f.itemName}</span>
                        <span className={`ml-2 text-xs font-medium ${f.trend === 'increasing' ? 'text-emerald-400' : f.trend === 'decreasing' ? 'text-red-400' : 'text-slate-400'}`}>
                          {f.trend}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">{f.currentStock} in stock</span>
                        <span className={`text-sm font-bold ${f.daysUntilStockout < 7 ? 'text-red-400' : 'text-amber-400'}`}>
                          {f.daysUntilStockout === 999 ? '∞' : `${Math.floor(f.daysUntilStockout)}d`} left
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
