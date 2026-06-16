"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";
import { TableRowSkeleton } from "@/components/ui/SkeletonLoader";
import { EmptyOrders } from "@/components/ui/EmptyState";

type VendorMapping = {
  vendor_id: string;
  vendors?: {
    name: string | null;
  }[] | null;
};

type OrderRow = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount_tzs: number;
  status: string;
  payment_status: string;
  created_at: string;
};

const DEMO_VENDOR: VendorMapping = {
  vendor_id: "demo-vendor-1",
  vendors: [{ name: "Mlimani School Supplies" }],
};

const DEMO_ORDERS: OrderRow[] = [
  {
    id: "demo-order-1",
    customer_name: "Neema M.",
    customer_phone: "+255712345678",
    total_amount_tzs: 125000,
    status: "pending",
    payment_status: "pending",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-order-2",
    customer_name: "John P.",
    customer_phone: "+255743210987",
    total_amount_tzs: 218000,
    status: "completed",
    payment_status: "paid",
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-order-3",
    customer_name: "Asha K.",
    customer_phone: "+255765998877",
    total_amount_tzs: 89000,
    status: "processing",
    payment_status: "paid",
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];

function orderStatusClass(status: string): string {
  const value = status.toLowerCase();
  if (value === 'paid' || value === 'completed') {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }
  if (value === 'failed' || value === 'cancelled') {
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  }
  if (
    value === 'awaiting_payment' ||
    value === 'processing' ||
    value === 'pending'
  ) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }
  return 'bg-slate-800 text-slate-200 border-slate-600';
}

function paymentStatusClass(status: string): string {
  const value = status.toLowerCase();
  if (value === 'paid') {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }
  if (value === 'failed') {
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  }
  if (value === 'pending' || value === 'unpaid') {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }
  return 'bg-slate-800 text-slate-200 border-slate-600';
}

export default function DashboardOrdersPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [vendor, setVendor] = useState<VendorMapping | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const loadOrders = useCallback(async (
    vendorId: string,
    filters?: { status?: string; fromDate?: string; toDate?: string },
  ) => {
    if (isDemoMode) {
      setOrders(DEMO_ORDERS);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabaseClient
      .from('orders')
      .select(
        'id, customer_name, customer_phone, total_amount_tzs, status, payment_status, created_at',
      )
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.fromDate) {
      query = query.gte('created_at', `${filters.fromDate}T00:00:00Z`);
    }

    if (filters?.toDate) {
      query = query.lte('created_at', `${filters.toDate}T23:59:59Z`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading orders', error);
      setError('Failed to load orders.');
      setLoading(false);
      return;
    }

    setOrders((data as OrderRow[]) ?? []);
    setLoading(false);
  }, [isDemoMode]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      setIsDemoMode(false);

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
          return;
        }

        if (!mapping) {
          setVendor(DEMO_VENDOR);
          setOrders(DEMO_ORDERS);
          setIsDemoMode(true);
          return;
        }

        setVendor(mapping as unknown as VendorMapping);

        await loadOrders(mapping.vendor_id, {});
      } catch (err) {
        console.error('Unexpected error loading orders dashboard', err);
        setVendor(DEMO_VENDOR);
        setOrders(DEMO_ORDERS);
        setIsDemoMode(true);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [loadOrders, router]);

  const handleFilterSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!vendor) return;

    await loadOrders(vendor.vendor_id, {
      status: statusFilter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!vendor) return;

    if (isDemoMode) {
      addToast({
        type: 'success',
        title: 'Demo mode',
        message: 'Status changes are disabled while viewing demo orders.',
      });
      return;
    }

    setUpdatingId(orderId);
    setUpdateError(null);

    const { error: updateErr } = await supabaseClient
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (updateErr) {
      console.error('Error updating order status', updateErr);
      setUpdateError('Failed to update order status.');
      addToast({
        type: 'error',
        title: 'Order status not updated',
        message: 'Something went wrong. Please try again.',
      });
      setUpdatingId(null);
      return;
    }

    await loadOrders(vendor.vendor_id, {
      status: statusFilter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });

    addToast({
      type: 'success',
      title: 'Order status updated',
      message: `New status: ${newStatus}`,
    });

    setUpdatingId(null);
  };

  if (loading && !vendor) {
    return (
      <main className="flex min-h-screen flex-col">
        <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
            <div className="h-4 w-24 rounded-full bg-slate-800 animate-pulse mb-3" />
            <div className="h-9 w-48 rounded-lg bg-slate-800 animate-pulse" />
          </div>
        </section>
        <div className="mx-auto max-w-6xl w-full px-4 py-8 md:px-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 animate-pulse h-24" />
          ))}
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
            <p className="text-lg font-bold text-red-200">Error loading orders</p>
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

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <nav className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/dashboard" className="hover:text-sky-400 transition-colors">Dashboard</Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-200">Orders</span>
          </nav>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl">Orders</h1>
              <p className="mt-2 text-base text-slate-400">Managing <span className="font-semibold text-slate-200">{vendorName}</span> &mdash; {orders.length} order{orders.length === 1 ? '' : 's'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl w-full px-4 py-8 md:px-6 flex flex-col gap-6">
        {isDemoMode && (
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Demo mode: sample orders are shown because your account is not linked to a vendor.
          </section>
        )}

        {/* Filters */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="awaiting_payment">Awaiting payment</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">From date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">To date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105">
                Apply
              </button>
            </div>
          </form>
        </section>

        {/* Orders list */}
        <section className="space-y-3">
          {updateError && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4">
              <svg className="h-5 w-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm text-red-200">{updateError}</p>
            </div>
          )}
          {loading && orders.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 animate-pulse h-24" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 p-16 text-center">
              <div className="rounded-full bg-slate-800 p-5 text-slate-400">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-200">No orders yet</p>
                <p className="mt-1 text-sm text-slate-400">Orders will appear here once customers place them.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map((order) => {
                const created = new Date(order.created_at).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
                return (
                  <article key={order.id} className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/60">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-widest text-slate-400">{created}</p>
                        <p className="font-semibold text-slate-100">{order.customer_name || 'Anonymous'}</p>
                        <p className="text-sm text-slate-400">{order.customer_phone || 'No phone'}</p>
                      </div>
                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <p className="text-xl font-bold text-sky-400">{order.total_amount_tzs.toLocaleString('en-TZ')} <span className="text-sm font-normal text-slate-400">TZS</span></p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${orderStatusClass(order.status)}`}>{order.status.replace('_', ' ')}</span>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${paymentStatusClass(order.payment_status)}`}>{order.payment_status}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-400">Update status</label>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              disabled={updatingId === order.id}
                              className="rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-50 outline-none transition-all focus:border-sky-500 disabled:opacity-50"
                            >
                              <option value="pending">Pending</option>
                              <option value="awaiting_payment">Awaiting payment</option>
                              <option value="paid">Paid</option>
                              <option value="processing">Processing</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="failed">Failed</option>
                            </select>
                          </div>
                          <Link href={`/dashboard/orders/${order.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-sky-500/50 hover:text-sky-400">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
