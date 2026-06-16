import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabaseServer";

interface InvoicePageProps {
  params: {
    orderId: string;
  };
  searchParams?: {
    token?: string;
  };
}

export default async function InvoicePage({ params, searchParams }: InvoicePageProps) {
  const orderId = params.orderId;
  const publicToken = searchParams?.token ?? "";

  if (!publicToken) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
        <p className="rounded-lg border border-amber-500/40 bg-amber-950/40 p-4 text-sm text-amber-100">
          This invoice link is missing its access token.
        </p>
      </main>
    );
  }

  const [{ data: order }, { data: items }] = await Promise.all([
    supabaseServerClient
      .from("orders")
      .select("id, vendor_id, customer_name, customer_phone, student_name, school_name, total_amount_tzs, status, payment_status, created_at, vendors(name, region, district, ward, phone_number, email)")
      .eq("id", orderId)
      .eq("public_access_token", publicToken)
      .maybeSingle(),
    supabaseServerClient
      .from("order_items")
      .select("id, quantity, unit_price_tzs, total_price_tzs, inventory:inventory_id(name, category)")
      .eq("order_id", orderId)
      .order("id", { ascending: true }),
  ]);

  if (!order) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12">
        <p className="text-sm text-red-400">Invoice not found.</p>
      </main>
    );
  }

  const vendor = Array.isArray(order.vendors) ? order.vendors[0] : order.vendors;
  const orderItems = items ?? [];
  const created = new Date(order.created_at).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12 print:py-0">
      {/* Print controls */}
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Link href={`/orders/${orderId}?token=${encodeURIComponent(publicToken)}`} className="text-sm font-medium text-sky-400 hover:text-sky-300">
          ← Back to order
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Print Invoice
        </button>
      </div>

      {/* Invoice */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 print:border-none print:bg-white print:p-0 print:text-black">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between border-b border-slate-800 pb-6 print:border-gray-300">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-xl font-extrabold text-white print:bg-gray-200 print:text-gray-800">
                S
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-50 print:text-black">Shuleyetu</h1>
                <p className="text-xs text-slate-400 print:text-gray-600">School Supply Marketplace</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-200 print:text-black">INVOICE</p>
            <p className="mt-1 text-xs text-slate-400 print:text-gray-600">#{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-slate-400 print:text-gray-600">{created}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-400 print:bg-gray-100 print:text-gray-700">
              <span className={`h-1.5 w-1.5 rounded-full ${order.payment_status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {order.payment_status}
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 border-b border-slate-800 pb-6 print:border-gray-300">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 print:text-gray-500">From</p>
            <p className="mt-2 text-sm font-bold text-slate-100 print:text-black">{vendor?.name ?? "Vendor"}</p>
            <p className="text-xs text-slate-400 mt-1 print:text-gray-600">
              {[vendor?.region, vendor?.district, vendor?.ward].filter(Boolean).join(", ") || "Tanzania"}
            </p>
            {vendor?.phone_number && <p className="text-xs text-slate-400 mt-1 print:text-gray-600">{vendor.phone_number}</p>}
            {vendor?.email && <p className="text-xs text-slate-400 mt-1 print:text-gray-600">{vendor.email}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 print:text-gray-500">Bill To</p>
            <p className="mt-2 text-sm font-bold text-slate-100 print:text-black">{order.customer_name || "Customer"}</p>
            <p className="text-xs text-slate-400 mt-1 print:text-gray-600">{order.customer_phone || "No phone"}</p>
            {order.student_name && (
              <p className="text-xs text-slate-400 mt-1 print:text-gray-600">Student: {order.student_name}</p>
            )}
            {order.school_name && (
              <p className="text-xs text-slate-400 mt-1 print:text-gray-600">School: {order.school_name}</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left print:border-gray-300">
                <th className="pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 print:text-gray-500">Item</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 print:text-gray-500 text-right">Qty</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 print:text-gray-500 text-right">Unit Price</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 print:text-gray-500 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 print:divide-gray-200">
              {orderItems.map((item) => {
                const inventory = Array.isArray(item.inventory) ? item.inventory[0] : item.inventory;
                return (
                  <tr key={item.id}>
                    <td className="py-3 text-slate-100 print:text-black">
                      <p className="font-medium">{inventory?.name || "Unnamed item"}</p>
                      <p className="text-xs text-slate-400 print:text-gray-500">{inventory?.category || "No category"}</p>
                    </td>
                    <td className="py-3 text-right text-slate-300 print:text-black">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-300 print:text-black">{item.unit_price_tzs.toLocaleString("en-TZ")} TZS</td>
                    <td className="py-3 text-right font-semibold text-slate-100 print:text-black">{item.total_price_tzs.toLocaleString("en-TZ")} TZS</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end border-t border-slate-800 pt-6 print:border-gray-300">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 print:text-gray-600">Subtotal</span>
              <span className="text-slate-200 print:text-black">{order.total_amount_tzs.toLocaleString("en-TZ")} TZS</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 print:text-gray-600">Tax</span>
              <span className="text-slate-200 print:text-black">0 TZS</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-3 text-base font-bold print:border-gray-300">
              <span className="text-slate-100 print:text-black">Total</span>
              <span className="text-sky-400 print:text-black">{order.total_amount_tzs.toLocaleString("en-TZ")} TZS</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-800 pt-6 text-center print:border-gray-300">
          <p className="text-xs text-slate-500 print:text-gray-500">
            Thank you for using Shuleyetu — Tanzania&apos;s School Supply Marketplace
          </p>
          <p className="text-xs text-slate-600 mt-1 print:text-gray-400">
            shuleyetu-web.vercel.app
          </p>
        </div>
      </div>
    </main>
  );
}
