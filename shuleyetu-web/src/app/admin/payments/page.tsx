"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type RefundRequest = {
  id: string;
  order_id: string;
  amount_tzs: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  admin_note: string | null;
  created_at: string;
  requester_email?: string | null;
};

type AuditLog = {
  id: string;
  order_id: string | null;
  action: string;
  actor_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export default function AdminPaymentsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stuckCount, setStuckCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconcileStatus, setReconcileStatus] = useState<string | null>(null);
  const [processingRefundId, setProcessingRefundId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<string>("");

  const checkAdmin = useCallback(async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const threshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const [
        { data: refundData, error: refundError },
        { data: auditData, error: auditError },
        { count: stuck, error: stuckError },
      ] = await Promise.all([
        supabaseClient
          .from("refund_requests")
          .select("id, order_id, amount_tzs, reason, status, admin_note, created_at, requester:requester_user_id(email)")
          .order("created_at", { ascending: false })
          .limit(100),
        supabaseClient
          .from("order_audit_log")
          .select("id, order_id, action, actor_type, payload, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabaseClient
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("payment_status", "pending")
          .lte("updated_at", threshold),
      ]);

      if (refundError) throw refundError;
      if (auditError) throw auditError;
      if (stuckError) throw stuckError;

      setRefunds(
        (refundData ?? []).map((r: unknown) => {
          const row = r as { requester?: { email?: string } | { email?: string }[] } & RefundRequest;
          const requester = Array.isArray(row.requester) ? row.requester[0] : row.requester;
          return {
            ...row,
            requester_email: requester?.email ?? null,
          };
        })
      );
      setAuditLogs(auditData ?? []);
      setStuckCount(stuck ?? 0);
    } catch (err) {
      console.error("Error loading admin payments data", err);
      setError("Failed to load payments data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await checkAdmin();
      if (isAdmin !== false) {
        await loadData();
      }
    };
    void init();
  }, [checkAdmin, loadData, isAdmin]);

  if (isAdmin === false) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-red-200">
          Forbidden: admin access required.
        </p>
      </main>
    );
  }

  const handleReconcile = async () => {
    setReconcileStatus("Reconciling…");
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      const res = await fetch("/api/admin/payments/reconcile", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const data = (await res.json()) as { success?: boolean; checked?: number; reconciled?: number; failed?: number };
      if (res.ok && data.success) {
        setReconcileStatus(`Checked ${data.checked ?? 0}, reconciled ${data.reconciled ?? 0}, failed ${data.failed ?? 0}`);
        await loadData();
      } else {
        setReconcileStatus("Reconciliation failed");
      }
    } catch (err) {
      console.error("Reconciliation error", err);
      setReconcileStatus("Reconciliation error");
    }
  };

  const handleRefundAction = async (refundId: string, action: "approve" | "reject") => {
    setProcessingRefundId(refundId);
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      const body = action === "reject" ? JSON.stringify({ adminNote }) : undefined;
      const res = await fetch(`/api/admin/refunds/${refundId}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          "Content-Type": "application/json",
        },
        body,
      });
      if (res.ok) {
        setAdminNote("");
        await loadData();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setError(err.error ?? `Failed to ${action} refund`);
      }
    } catch (err) {
      console.error("Refund action error", err);
      setError(`Failed to ${action} refund`);
    } finally {
      setProcessingRefundId(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Payments & Trust</h1>
        <Link href="/admin" className="text-sm text-sky-400 hover:text-sky-300">
          ← Back to admin
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Pending Refunds</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {refunds.filter((r) => r.status === "pending").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Stuck Payments</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">{stuckCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Refunds</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{refunds.length}</p>
        </div>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={handleReconcile}
          disabled={reconcileStatus?.startsWith("Reconciling")}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-500 disabled:opacity-50"
        >
          Reconcile Stuck Payments
        </button>
        {reconcileStatus && <span className="text-sm text-slate-400">{reconcileStatus}</span>}
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Refund Requests</h2>
        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : refunds.length === 0 ? (
          <p className="text-slate-500">No refund requests yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {refunds.map((refund) => (
                  <tr key={refund.id}>
                    <td className="px-4 py-3 font-mono text-slate-300">{refund.order_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-slate-200">{Number(refund.amount_tzs).toLocaleString()} TZS</td>
                    <td className="px-4 py-3 text-slate-400">{refund.reason}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          refund.status === "pending"
                            ? "bg-amber-500/10 text-amber-400"
                            : refund.status === "approved" || refund.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {refund.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(refund.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {refund.status === "pending" && (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="Admin note (required for reject)"
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            className="w-48 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRefundAction(refund.id, "approve")}
                              disabled={processingRefundId === refund.id}
                              className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRefundAction(refund.id, "reject")}
                              disabled={processingRefundId === refund.id || !adminNote.trim()}
                              className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Recent Audit Log</h2>
        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : auditLogs.length === 0 ? (
          <p className="text-slate-500">No audit events yet.</p>
        ) : (
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-900/40 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">{log.action}</p>
                  <p className="text-xs text-slate-500">
                    {log.actor_type} {log.order_id ? `· order ${log.order_id.slice(0, 8)}` : ""}
                  </p>
                </div>
                <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
