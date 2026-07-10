"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  getFees,
  getStudents,
  createFee,
  recordFeePayment,
  type SchoolFee,
  type SchoolStudent,
} from "@/lib/schoolPortal";
import {
  Loading,
  EmptyMessage,
  Input,
  Button,
  SubmitButton,
  Badge,
  ConfirmModal,
  downloadCsv,
} from "./shared";

export function FeesTab() {
  const [fees, setFees] = useState<SchoolFee[]>([]);
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [payTarget, setPayTarget] = useState<SchoolFee | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payRef, setPayRef] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    const [{ data: feesData }, { data: studentData }] = await Promise.all([
      getFees({ status: filterStatus || undefined }),
      getStudents({ status: "active" }),
    ]);
    setLoading(false);
    setFees(feesData?.fees ?? []);
    setStudents(studentData?.students ?? []);
  };

  useEffect(() => { void load(); }, [filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await createFee({
      student_id: String(fd.get("student_id")),
      description: String(fd.get("description")).trim(),
      amount_tzs: Number(fd.get("amount_tzs")),
      due_date: String(fd.get("due_date")) || null,
    });
    setSubmitting(false);
    if (error) {
      addToast({ type: "error", title: "Failed to create fee", message: error });
    } else {
      addToast({ type: "success", title: "Fee invoice created" });
      setFormOpen(false);
      e.currentTarget.reset();
      void load();
    }
  };

  const onRecordPayment = async () => {
    if (!payTarget) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      addToast({ type: "error", title: "Invalid amount", message: "Enter a positive payment amount." });
      return;
    }
    setPaySubmitting(true);
    const { error } = await recordFeePayment({
      fee_id: payTarget.id,
      amount_tzs: amount,
      payment_method: payMethod,
      reference: payRef.trim() || null,
    });
    setPaySubmitting(false);
    if (error) {
      addToast({ type: "error", title: "Payment failed", message: error });
    } else {
      addToast({ type: "success", title: "Payment recorded" });
      setPayTarget(null);
      setPayAmount("");
      setPayRef("");
      setPayMethod("cash");
      void load();
    }
  };

  const handleExport = () => {
    const headers = ["Student", "Description", "Amount (TZS)", "Paid (TZS)", "Balance (TZS)", "Status", "Due Date"];
    const rows = filtered.map((f) => [
      `${f.school_students?.first_name ?? ""} ${f.school_students?.last_name ?? ""}`.trim(),
      f.description,
      f.amount_tzs,
      f.paid_tzs,
      f.balance_tzs,
      f.status,
      f.due_date ?? "",
    ]);
    downloadCsv(`fees-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const filtered = fees.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (f.school_students?.first_name ?? "").toLowerCase().includes(q) ||
      (f.school_students?.last_name ?? "").toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q)
    );
  });

  const totalInvoiced = filtered.reduce((s, f) => s + Number(f.amount_tzs), 0);
  const totalPaid = filtered.reduce((s, f) => s + f.paid_tzs, 0);
  const totalDue = filtered.reduce((s, f) => s + f.balance_tzs, 0);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-50">Fees</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport} size="sm">Export CSV</Button>
          <Button onClick={() => setFormOpen(!formOpen)}>
            {formOpen ? "Close" : "Add fee"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student or description..."
          className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 outline-none focus:border-sky-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="waived">Waived</option>
        </select>
      </div>

      {/* Totals */}
      {filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Invoiced", value: totalInvoiced, color: "text-slate-200" },
            { label: "Collected", value: totalPaid, color: "text-emerald-400" },
            { label: "Outstanding", value: totalDue, color: "text-amber-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`mt-1 text-lg font-bold ${color}`}>
                TZS {value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="font-semibold text-slate-200">New fee invoice</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Student <span className="text-red-400">*</span>
              </label>
              <select
                name="student_id"
                required
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none focus:border-sky-500"
              >
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.admission_number})
                  </option>
                ))}
              </select>
            </div>
            <Input name="amount_tzs" type="number" label="Amount (TZS)" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="description" label="Description" placeholder="e.g. Tuition Term 1" required />
            <Input name="due_date" type="date" label="Due date" />
          </div>
          <div className="flex gap-3">
            <SubmitButton loading={submitting}>Create invoice</SubmitButton>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <EmptyMessage message="No fees found. Try adjusting filters or create a new fee invoice." />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Paid</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-medium text-slate-100">
                    {f.school_students?.first_name} {f.school_students?.last_name}
                    {f.due_date && (
                      <span className="block text-xs text-slate-500">
                        Due: {new Date(f.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{f.description}</td>
                  <td className="px-6 py-4 text-right text-slate-300">
                    {Number(f.amount_tzs).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-400">
                    {f.paid_tzs.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-200">
                    {f.balance_tzs.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={f.status as "pending" | "partial" | "paid" | "waived"}>{f.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {f.status !== "paid" && f.status !== "waived" && (
                      <Button size="sm" onClick={() => { setPayTarget(f); setPayAmount(String(f.balance_tzs)); }}>
                        Record payment
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment modal */}
      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-50">Record payment</h3>
            <p className="mt-1 text-sm text-slate-400">
              {payTarget.school_students?.first_name} {payTarget.school_students?.last_name} —{" "}
              {payTarget.description}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Balance: TZS {payTarget.balance_tzs.toLocaleString()}
            </p>
            <div className="mt-5 space-y-4">
              <Input
                name="amount"
                label="Payment amount (TZS)"
                type="number"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Payment method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none focus:border-sky-500"
                >
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile money</option>
                  <option value="bank">Bank transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <Input
                name="reference"
                label="Reference / receipt number (optional)"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setPayTarget(null)} disabled={paySubmitting}>
                Cancel
              </Button>
              <Button onClick={() => void onRecordPayment()} disabled={paySubmitting}>
                {paySubmitting ? "Saving..." : "Save payment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
