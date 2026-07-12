"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  getClasses,
  getStudents,
  createStudent,
  updateStudentStatus,
  updateStudent,
  deleteStudent,
  type SchoolClass,
  type SchoolStudent,
} from "@/lib/schoolPortal";
import {
  Loading,
  EmptyMessage,
  Input,
  Select,
  Button,
  SubmitButton,
  Badge,
  ConfirmModal,
  downloadCsv,
} from "./shared";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "transferred", label: "Transferred" },
];

export function StudentsTab() {
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterClass, setFilterClass] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusChanging, setStatusChanging] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SchoolStudent | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SchoolStudent | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const { addToast } = useToast();

  const load = async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    const [{ data: classData }, { data: studentData, error }] = await Promise.all([
      pageNum === 1 ? getClasses() : Promise.resolve({ data: { classes, page: 1, limit: 50, hasMore: false }, error: null }),
      getStudents({ classId: filterClass || undefined, status: filterStatus || undefined, page: pageNum }),
    ]);
    if (append) setLoadingMore(false); else setLoading(false);
    if (pageNum === 1) setClasses(classData?.classes ?? []);
    if (error) {
      addToast({ type: "error", title: "Failed to load students", message: error });
    } else {
      const incoming = studentData?.students ?? [];
      setStudents(append ? (prev) => [...prev, ...incoming] : incoming);
      setHasMore(studentData?.hasMore ?? false);
    }
  };

  useEffect(() => {
    setPage(1);
    void load(1, false);
  }, [filterClass, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    void load(nextPage, true);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await createStudent({
      admission_number: String(fd.get("admission_number") ?? "").trim(),
      first_name: String(fd.get("first_name") ?? "").trim(),
      last_name: String(fd.get("last_name") ?? "").trim(),
      gender: (String(fd.get("gender")) as SchoolStudent["gender"]) || null,
      date_of_birth: String(fd.get("date_of_birth") ?? "") || null,
      class_id: String(fd.get("class_id") ?? "") || null,
      parent_name: String(fd.get("parent_name") ?? "").trim() || null,
      parent_phone: String(fd.get("parent_phone") ?? "").trim() || null,
      parent_email: String(fd.get("parent_email") ?? "").trim() || null,
      address: String(fd.get("address") ?? "").trim() || null,
      enrollment_date: String(fd.get("enrollment_date") ?? "") || null,
    });
    setSubmitting(false);
    if (error) {
      addToast({ type: "error", title: "Failed to add student", message: error });
    } else {
      addToast({ type: "success", title: "Student added" });
      setFormOpen(false);
      e.currentTarget.reset();
      setPage(1);
      void load(1, false);
    }
  };

  const onEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await updateStudent(editTarget.id, {
      first_name: String(fd.get("first_name") ?? "").trim(),
      last_name: String(fd.get("last_name") ?? "").trim(),
      admission_number: String(fd.get("admission_number") ?? "").trim(),
      gender: (String(fd.get("gender")) as SchoolStudent["gender"]) || null,
      date_of_birth: String(fd.get("date_of_birth") ?? "") || null,
      class_id: String(fd.get("class_id") ?? "") || null,
      parent_name: String(fd.get("parent_name") ?? "").trim() || null,
      parent_phone: String(fd.get("parent_phone") ?? "").trim() || null,
      parent_email: String(fd.get("parent_email") ?? "").trim() || null,
      address: String(fd.get("address") ?? "").trim() || null,
      enrollment_date: String(fd.get("enrollment_date") ?? "") || null,
      status: String(fd.get("status") ?? "active"),
    });
    setEditSubmitting(false);
    if (error) {
      addToast({ type: "error", title: "Failed to update student", message: error });
    } else {
      addToast({ type: "success", title: "Student updated" });
      setEditTarget(null);
      setPage(1);
      void load(1, false);
    }
  };

  const onStatusChange = async (studentId: string, newStatus: string) => {
    setStatusChanging(studentId);
    const { error } = await updateStudentStatus(studentId, newStatus);
    setStatusChanging(null);
    if (error) {
      addToast({ type: "error", title: "Status update failed", message: error });
    } else {
      addToast({ type: "success", title: "Status updated" });
      setPage(1);
      void load(1, false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    const { error } = await deleteStudent(deleteTarget.id);
    setDeleteSubmitting(false);
    if (error) {
      addToast({ type: "error", title: "Failed to delete student", message: error });
    } else {
      addToast({ type: "success", title: "Student deleted" });
      setPage(1);
      void load(1, false);
    }
    setDeleteTarget(null);
  };

  const handleExport = () => {
    const headers = ["Admission No", "First Name", "Last Name", "Gender", "Class", "Status", "Parent", "Phone"];
    const rows = filtered.map((s) => [
      s.admission_number,
      s.first_name,
      s.last_name,
      s.gender ?? "",
      s.school_classes?.name ?? "",
      s.status,
      s.parent_name ?? "",
      s.parent_phone ?? "",
    ]);
    downloadCsv(`students-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.admission_number.toLowerCase().includes(q) ||
      (s.parent_name ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) return <Loading />;


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-50">Students</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport} size="sm">Export CSV</Button>
          <Button onClick={() => setFormOpen(!formOpen)}>
            {formOpen ? "Close" : "Add student"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or admission no..."
          className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 outline-none focus:border-sky-500"
        />
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="transferred">Transferred</option>
        </select>
      </div>

      {formOpen && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="font-semibold text-slate-200">New student</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="admission_number" label="Admission number" required />
            <Select
              name="class_id"
              label="Class"
              options={[{ value: "", label: "— no class —" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="first_name" label="First name" required />
            <Input name="last_name" label="Last name" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select name="gender" label="Gender" options={[{ value: "", label: "— select —" }, { value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]} />
            <Input name="date_of_birth" type="date" label="Date of birth" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="parent_name" label="Parent / guardian name" />
            <Input name="parent_phone" label="Parent phone" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="parent_email" type="email" label="Parent email" />
            <Input name="enrollment_date" type="date" label="Enrollment date" />
          </div>
          <Input name="address" label="Address" />
          <div className="flex gap-3">
            <SubmitButton loading={submitting}>Save student</SubmitButton>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Edit panel */}
      {editTarget && (
        <form onSubmit={onEditSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="font-semibold text-slate-200">Edit student — {editTarget.first_name} {editTarget.last_name}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="admission_number" label="Admission number" required defaultValue={editTarget.admission_number} />
            <Select
              name="class_id"
              label="Class"
              defaultValue={editTarget.class_id ?? ""}
              options={[{ value: "", label: "— no class —" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="first_name" label="First name" required defaultValue={editTarget.first_name} />
            <Input name="last_name" label="Last name" required defaultValue={editTarget.last_name} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select name="gender" label="Gender" defaultValue={editTarget.gender ?? ""} options={[{ value: "", label: "— select —" }, { value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]} />
            <Input name="date_of_birth" type="date" label="Date of birth" defaultValue={editTarget.date_of_birth ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="parent_name" label="Parent / guardian name" defaultValue={editTarget.parent_name ?? ""} />
            <Input name="parent_phone" label="Parent phone" defaultValue={editTarget.parent_phone ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="parent_email" type="email" label="Parent email" defaultValue={editTarget.parent_email ?? ""} />
            <Input name="enrollment_date" type="date" label="Enrollment date" defaultValue={editTarget.enrollment_date ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="address" label="Address" defaultValue={editTarget.address ?? ""} />
            <Select name="status" label="Status" defaultValue={editTarget.status} options={STATUS_OPTIONS} />
          </div>
          <div className="flex gap-3">
            <SubmitButton loading={editSubmitting}>Update student</SubmitButton>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <EmptyMessage message="No students found. Try adjusting filters or add a new student." />
      ) : (
        <>
          <p className="text-xs text-slate-500">{students.length} student{students.length !== 1 ? "s" : ""} loaded</p>
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Admission</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Parent</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-slate-400">{s.admission_number}</td>
                    <td className="px-6 py-4 font-medium text-slate-100">
                      {s.first_name} {s.last_name}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {s.school_classes?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-400 capitalize">{s.gender ?? "—"}</td>
                    <td className="px-6 py-4 text-slate-400">{s.parent_name ?? "—"}</td>
                    <td className="px-6 py-4">
                      <select
                        value={s.status}
                        disabled={statusChanging === s.id}
                        onChange={(e) => void onStatusChange(s.id, e.target.value)}
                        className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-50 outline-none focus:border-sky-500 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditTarget(s)}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-all hover:bg-red-500/20"
                          aria-label={`Delete ${s.first_name} ${s.last_name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete student"
        message={deleteTarget ? `Are you sure you want to delete ${deleteTarget.first_name} ${deleteTarget.last_name}? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={deleteSubmitting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
