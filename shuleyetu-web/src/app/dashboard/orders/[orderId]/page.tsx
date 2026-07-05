"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type VendorMapping = {
  vendor_id: string;
  vendors?: {
    name: string | null;
  }[] | null;
};

type OrderDetail = {
  id: string;
  vendor_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  student_name: string | null;
  school_name: string | null;
  total_amount_tzs: number;
  status: string;
  payment_status: string;
  created_at: string;
};

type OrderItemRow = {
  id: string;
  quantity: number;
  unit_price_tzs: number;
  total_price_tzs: number;
  inventory?:
    | {
        name: string | null;
        category: string | null;
      }
    | {
        name: string | null;
        category: string | null;
      }[]
    | null;
};

interface PageProps {
  params: {
    orderId: string;
  };
}

export default function DashboardOrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const orderId = params.orderId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorMapping | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError) {
        console.error("Error getting user", userError);
        setError("Failed to load user.");
        setLoading(false);
        return;
      }

      if (!user) {
        router.push(`/auth/vendor-login?next=/dashboard/orders/${orderId}`);
        return;
      }

      const { data: mapping, error: mapError } = await supabaseClient
        .from("vendor_users")
        .select("vendor_id, vendors(name)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (mapError) {
        console.error("Error loading vendor mapping", mapError);
        setError("Failed to load vendor mapping.");
        setLoading(false);
        return;
      }

      if (!mapping) {
        setError(
          "No vendor is linked to this user. An admin must add a row in vendor_users for you.",
        );
        setLoading(false);
        return;
      }

      setVendor(mapping as unknown as VendorMapping);

      const [{ data: orderRow, error: orderError }, { data: itemRows, error: itemsError }] =
        await Promise.all([
          supabaseClient
            .from("orders")
            .select(
              "id, vendor_id, customer_name, customer_phone, student_name, school_name, total_amount_tzs, status, payment_status, created_at",
            )
            .eq("id", orderId)
            .maybeSingle(),
          supabaseClient
            .from("order_items")
            .select(
              "id, quantity, unit_price_tzs, total_price_tzs, inventory:inventory_id(name, category)",
            )
            .eq("order_id", orderId)
            .order("id", { ascending: true }),
        ]);

      if (orderError) {
        console.error("Error loading order", orderError);
        setError("Failed to load order.");
        setLoading(false);
        return;
      }

      if (!orderRow) {
        setError("Order not found.");
        setLoading(false);
        return;
      }

      // Defense-in-depth: ensure vendor id matches mapping (RLS should enforce this already)
      if (orderRow.vendor_id !== mapping.vendor_id) {
        setError("You do not have access to this order.");
        setLoading(false);
        return;
      }

      if (itemsError) {
        console.error("Error loading order items", itemsError);
      }

      setOrder(orderRow as OrderDetail);
      setItems(((itemRows ?? []) as unknown as OrderItemRow[]) ?? []);
      setLoading(false);
    };

    void load();
  }, [orderId, router]);

  const created = useMemo(() => {
    if (!order) return "";
    return new Date(order.created_at).toLocaleString("en-TZ", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [order]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-3 py-8 md:px-4 md:py-12">
        <header className="space-y-2">
          <div className="h-4 w-24 rounded bg-slate-800 animate-pulse" />
          <div className="h-7 w-56 rounded bg-slate-800 animate-pulse" />
          <div className="h-4 w-64 rounded bg-slate-900 animate-pulse" />
        </header>
        <section className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-20 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse"
            />
          ))}
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-3 py-8 md:px-4 md:py-12">
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-100">
          {error}
        </p>
        <Link
          href="/dashboard/orders"
          className="text-sm font-medium text-sky-400 hover:text-sky-300"
        >
          ← Back to orders
        </Link>
      </main>
    );
  }

  const vendorName = vendor?.vendors?.[0]?.name ?? "Your vendor";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-12">
      <header className="space-y-2">
        <Link
          href="/dashboard/orders"
          className="text-xs font-medium text-sky-400 hover:text-sky-300"
        >
          ← Orders
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
        <p className="text-sm text-slate-300">
          {vendorName} · {created}
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-base font-semibold">Order details</h2>
          <div className="space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">Customer</p>
            <p className="text-slate-100">{order?.customer_name || "No name"}</p>
            <p className="text-xs text-slate-400">{order?.customer_phone || "No phone"}</p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">Student / school</p>
            <p className="text-slate-100">{order?.student_name || "No student name"}</p>
            <p className="text-xs text-slate-400">{order?.school_name || "No school name"}</p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-200">
                Order: {order?.status}
              </span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-200">
                Payment: {order?.payment_status}
              </span>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total</p>
            <p className="text-lg font-semibold text-sky-300">
              {order?.total_amount_tzs.toLocaleString("en-TZ")} TZS
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Items</h2>
            <span className="text-xs text-slate-400">{items.length} item(s)</span>
          </div>

          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-300">
              This order has no items recorded.
            </p>
          ) : (
            <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1 text-sm">
              {items.map((item) => {
                const inv = Array.isArray(item.inventory)
                  ? item.inventory[0]
                  : item.inventory;

                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-100">
                        {inv?.name || "Unnamed item"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {inv?.category || "No category"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-[11px] text-slate-300">
                      <span>
                        Qty: <span className="font-medium">{item.quantity}</span>
                      </span>
                      <span>
                        Unit: {item.unit_price_tzs.toLocaleString("en-TZ")} TZS
                      </span>
                      <span className="font-semibold text-sky-300">
                        {item.total_price_tzs.toLocaleString("en-TZ")} TZS
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
