"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  getStaff,
  createStaff,
  updateStaffStatus,
  type SchoolStaff,
} from "@/lib/schoolPortal";
import {
  Loading,
  EmptyMessage,
  Input,
  Select,
  Button,
  SubmitButton,
  Badge,
  downloadCsv,
} from "./shared";

const ROLE_OPTIONS = [
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Admin" },
  { value: "support", label: "Support" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function StaffTab() {
  const [staff, setStaff] = useState<SchoolStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusChanging, setStatusChanging] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await getStaff();
    setLoading(false);
    if (error) addToast({ type: "error", title: "Failed to load staff", message: error });
    else setStaff(data?.staff ?? []);
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await createStaff({
      employee_id: String(fd.get("employee_id") ?? "").trim() || null,
      first_name: String(fd.get("first_name") ?? "").trim(),
      last_name: String(fd.get("last_name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim() || null,
      phone: String(fd.get("phone") ?? "").trim() || null,
      role: String(fd.get("role")) as SchoolStaff["role"],
      subject: String(fd.get("subject") ?? "").trim() || null,
    });
    setSubmitting(false);
    if (error) {
      addToast({ type: "error", title: "Failed to add staff", message: error });
    } else {
      addToast({ type: "success", title: "Staff member added" });
      setFormOpen(false);
      e.currentTarget.reset();
      void load();
    }
  };

  const onStatusChange = async (staffId: string, newStatus: "active" | "inactive") => {
    setStatusChanging(staffId);
    const { error } = await updateStaffStatus(staffId, newStatus);
    setStatusChanging(null);
    if (error) {
      addToast({ type: "error", title: "Status update failed", message: error });
    } else {
      addToast({ type: "success", title: "Status updated" });
      void load();
    }
  };

  const handleExport = () => {
    const headers = ["Employee ID", "First Name", "Last Name", "Role", "Subject", "Email", "Phone", "Status"];
    const rows = filtered.map((s) => [
      s.employee_id ?? "",
      s.first_name,
      s.last_name,
      s.role,
      s.subject ?? "",
      s.email ?? "",
      s.phone ?? "",
      s.status,
    ]);
    downloadCsv(`staff-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const filtered = staff.filter((s) => {
    const matchSearch = !search || [s.first_name, s.last_name, s.email ?? "", s.subject ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchRole = !filterRole || s.role === filterRole;
    return matchSearch && matchRole;
  });

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-50">Staff</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport} size="sm">Export CSV</Button>
          <Button onClick={() => setFormOpen(!formOpen)}>
            {formOpen ? "Close" : "Add staff"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or subject..."
          className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 outline-none focus:border-sky-500"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
        >
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {formOpen && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="font-semibold text-slate-200">New staff member</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="employee_id" label="Employee ID" />
            <Select name="role" label="Role" options={ROLE_OPTIONS} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="first_name" label="First name" required />
            <Input name="last_name" label="Last name" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="email" type="email" label="Email" />
            <Input name="phone" label="Phone" />
          </div>
          <Input name="subject" label="Subject / department" />
          <div className="flex gap-3">
            <SubmitButton loading={submitting}>Save staff</SubmitButton>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <EmptyMessage message="No staff found. Adjust filters or add a new staff member." />
      ) : (
        <>
          <p className="text-xs text-slate-500">{filtered.length} staff member{filtered.length !== 1 ? "s" : ""} shown</p>
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-slate-400">{s.employee_id ?? "—"}</td>
                    <td className="px-6 py-4 font-medium text-slate-100">
                      {s.first_name} {s.last_name}
                      {s.email && <span className="block text-xs text-slate-500">{s.email}</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-400 capitalize">{s.role}</td>
                    <td className="px-6 py-4 text-slate-400">{s.subject ?? "—"}</td>
                    <td className="px-6 py-4 text-slate-400">{s.phone ?? "—"}</td>
                    <td className="px-6 py-4">
                      <select
                        value={s.status}
                        disabled={statusChanging === s.id}
                        onChange={(e) =>
                          void onStatusChange(s.id, e.target.value as "active" | "inactive")
                        }
                        className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-500 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
