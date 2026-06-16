import Link from "next/link";
import { OrderTimeline } from "@/components/ui/OrderTimeline";
import { supabaseServerClient } from "@/lib/supabaseServer";

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
  vendors?: {
    name: string | null;
  }[] | null;
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
  searchParams?: {
    token?: string;
  };
}

export default async function OrderDetailPage({ params, searchParams }: PageProps) {
  const orderId = params.orderId;
  const publicToken = searchParams?.token ?? "";

  if (!publicToken) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-12">
        <p className="rounded-lg border border-amber-500/40 bg-amber-950/40 p-4 text-sm text-amber-100">
          This order link is missing its access token.
        </p>
        <Link
          href="/orders/new"
          className="text-sm font-medium text-sky-400 hover:text-sky-300"
        >
          Create a new order
        </Link>
      </main>
    );
  }

  const [{ data: order, error: orderError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabaseServerClient
        .from("orders")
        .select(
          "id, vendor_id, customer_name, customer_phone, student_name, school_name, total_amount_tzs, status, payment_status, created_at, vendors(name)",
        )
        .eq("id", orderId)
        .eq("public_access_token", publicToken)
        .maybeSingle(),
      supabaseServerClient
        .from("order_items")
        .select(
          "id, quantity, unit_price_tzs, total_price_tzs, inventory:inventory_id(name, category)",
        )
        .eq("order_id", orderId)
        .order("id", { ascending: true }),
    ]);

  if (orderError) {
    console.error("Error loading order", orderError);
  }

  if (itemsError) {
    console.error("Error loading order items", itemsError);
  }

  if (!order) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-12">
        <p className="text-sm text-red-400">Order not found.</p>
        <Link
          href="/orders"
          className="text-sm font-medium text-sky-400 hover:text-sky-300"
        >
          ← Back to orders
        </Link>
      </main>
    );
  }

  const orderData = order as OrderDetail;
  const orderItems = (items ?? []) as unknown as OrderItemRow[];
  const vendorName = orderData.vendors?.[0]?.name ?? "Unknown vendor";
  const created = new Date(orderData.created_at).toLocaleString("en-TZ", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const canPay =
    orderData.payment_status === "unpaid" || orderData.payment_status === "pending";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-12">
      <header className="space-y-2">
        <Link
          href="/orders"
          className="text-xs font-medium text-sky-400 hover:text-sky-300"
        >
          ← All orders
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Order summary
        </h1>
        <p className="text-sm text-slate-300">{created}</p>
        {canPay && (
          <Link
            href={`/orders/pay/${orderId}?token=${encodeURIComponent(publicToken)}`}
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            Pay with ClickPesa
          </Link>
        )}
      </header>

      <section className="surface-panel rounded-3xl p-6">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Order Timeline</h2>
        <OrderTimeline currentStatus={orderData.status} paymentStatus={orderData.payment_status} />
      </section>

      <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-base font-semibold">Order details</h2>
          <div className="space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Vendor
            </p>
            <p className="font-medium text-slate-100">{vendorName}</p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Customer
            </p>
            <p className="text-slate-100">
              {orderData.customer_name || "No name"}
            </p>
            <p className="text-xs text-slate-400">
              {orderData.customer_phone || "No phone"}
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Student / school
            </p>
            <p className="text-slate-100">
              {orderData.student_name || "No student name"}
            </p>
            <p className="text-xs text-slate-400">
              {orderData.school_name || "No school name"}
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Status
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-200">
                Order: {orderData.status}
              </span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-200">
                Payment: {orderData.payment_status}
              </span>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Total
            </p>
            <p className="text-lg font-semibold text-sky-300">
              {orderData.total_amount_tzs.toLocaleString("en-TZ")} TZS
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Items</h2>
            <span className="text-xs text-slate-400">
              {orderItems.length} item(s)
            </span>
          </div>

          {orderItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-300">
              This order has no items recorded.
            </p>
          ) : (
            <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1 text-sm">
              {orderItems.map((item) => {
                const inventory = Array.isArray(item.inventory)
                  ? item.inventory[0]
                  : item.inventory;

                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-100">
                        {inventory?.name || "Unnamed item"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {inventory?.category || "No category"}
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
