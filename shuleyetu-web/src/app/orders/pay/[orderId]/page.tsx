"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

type Order = {
  id: string;
  total_amount_tzs: number;
  payment_status: string;
  status: string;
  customer_phone: string | null;
};

interface PageProps {
  params: {
    orderId: string;
  };
}

export default function ClickpesaPayPage({ params }: PageProps) {
  const { orderId } = params;

  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('This page requires an order access token. Use the shareable order link.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/orders/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, token, includeItems: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error loading order', data);
        setError(data.error || 'Failed to load order.');
        setOrder(null);
        setLoading(false);
        return;
      }

      setOrder(data.order as Order);

      setLoading(false);
    };

    void loadOrder();
  }, [orderId, token]);

  const handlePay = async () => {
    if (!order) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!token) {
        setError('Missing order access token.');
        return;
      }

      const response = await fetch('/api/clickpesa/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('ClickPesa pay error', data);
        setError(
          data.error ||
            'Failed to initiate ClickPesa payment. Please try again or contact support.',
        );
        showToast({
          variant: 'error',
          title: 'Payment not started',
          description: 'ClickPesa returned an error. Please try again.',
        });
      } else {
        setSuccess(
          'Payment request sent via ClickPesa. Ask the customer to approve the USSD prompt on their phone.',
        );
        showToast({
          variant: 'success',
          title: 'ClickPesa payment started',
          description: 'Ask the customer to approve the USSD prompt on their phone.',
        });

        const refreshResponse = await fetch('/api/orders/public', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId, token, includeItems: false }),
        });

        const refreshedData = await refreshResponse.json();
        if (refreshResponse.ok && refreshedData.order) {
          setOrder(refreshedData.order as Order);
        }
      }
    } catch (error) {
      console.error('Unexpected ClickPesa error', error);
      setError('Unexpected error when calling ClickPesa.');
      showToast({
        variant: 'error',
        title: 'Unexpected error',
        description: 'Something went wrong when contacting ClickPesa.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!order) return;

    setRefreshing(true);
    setError(null);
    setSuccess(null);

    try {
      if (!token) {
        setError('Missing order access token.');
        return;
      }

      const response = await fetch('/api/clickpesa/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('ClickPesa status error', data);
        setError(
          data.error ||
            'Failed to refresh payment status. Please try again or contact support.',
        );
        showToast({
          variant: 'error',
          title: 'Status not refreshed',
          description: 'ClickPesa could not refresh the payment status.',
        });
      } else {
        const refreshResponse = await fetch('/api/orders/public', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId, token, includeItems: false }),
        });

        const refreshedData = await refreshResponse.json();
        if (refreshResponse.ok && refreshedData.order) {
          setOrder(refreshedData.order as Order);
        }

        setSuccess('Payment status refreshed from ClickPesa.');
        showToast({
          variant: 'success',
          title: 'Status refreshed',
          description: 'Latest payment status fetched from ClickPesa.',
        });
      }
    } catch (error) {
      console.error('Unexpected ClickPesa status error', error);
      setError('Unexpected error when refreshing payment status.');
      showToast({
        variant: 'error',
        title: 'Unexpected error',
        description: 'Something went wrong when refreshing status.',
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-3 py-8 md:px-4 md:py-12">
        <header className="space-y-2">
          <div className="h-3 w-28 rounded bg-slate-800 animate-pulse" />
          <div className="h-6 w-56 rounded bg-slate-800 animate-pulse" />
          <div className="h-4 w-64 rounded bg-slate-900 animate-pulse" />
        </header>
        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="h-16 rounded-lg bg-slate-900/70 animate-pulse" />
          <div className="h-10 rounded-lg bg-slate-900/70 animate-pulse" />
        </section>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-12">
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-100">
          Order not found.
        </p>
        <Link
          href="/orders"
          className="text-sm font-medium text-sky-400 hover:text-sky-300"
        >
          Back to orders
        </Link>
      </main>
    );
  }

  const canPay =
    order.payment_status === 'unpaid' || order.payment_status === 'pending';

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-3 py-8 md:px-4 md:py-12">
      <header className="space-y-2">
        <Link
          href={token ? `/orders/${orderId}?token=${encodeURIComponent(token)}` : `/orders/${orderId}`}
          className="text-xs font-medium text-sky-400 hover:text-sky-300"
        >
          Back to order summary
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Pay with ClickPesa
        </h1>
        <p className="text-sm text-slate-300">
          Initiate a mobile money USSD push payment for this order.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="space-y-1 text-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Order</p>
          <p className="text-slate-100">ID: {order.id}</p>
          <p className="text-xs text-slate-400">
            Amount:{' '}
            <span className="font-semibold">
              {order.total_amount_tzs.toLocaleString('en-TZ')} TZS
            </span>
          </p>
        </div>

        <div className="space-y-1 text-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Current status
          </p>
          <p className="text-xs text-slate-300">Order status: {order.status}</p>
          <p className="text-xs text-slate-300">
            Payment status: {order.payment_status}
          </p>
        </div>

        <div className="space-y-1 text-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Customer phone
          </p>
          <p className="text-xs text-slate-300">
            {order.customer_phone || 'No phone saved'}
          </p>
          <p className="text-[11px] text-slate-400">
            ClickPesa expects the phone number in international format without the
            plus sign, for example 255712345678.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-100">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-100">
            {success}
          </p>
        )}

        {!canPay && (
          <p className="text-[11px] text-slate-400">
            This order is already {order.payment_status}. You cannot start another
            ClickPesa payment.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={submitting || !canPay}
            onClick={handlePay}
            className="inline-flex items-center justify-center rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {submitting ? 'Starting payment…' : 'Start ClickPesa payment'}
          </button>
          <button
            type="button"
            disabled={refreshing}
            onClick={handleRefreshStatus}
            className="inline-flex items-center justify-center rounded-md border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-100 hover:border-sky-500 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? 'Refreshing…' : 'Refresh payment status'}
          </button>
        </div>
      </section>
    </main>
  );
}
