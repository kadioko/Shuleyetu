"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  getClasses,
  getAttendance,
  saveAttendance,
  saveBulkAttendance,
  type SchoolClass,
  type SchoolStudent,
} from "@/lib/schoolPortal";
import { Loading, EmptyMessage, downloadCsv } from "./shared";

type AttendanceRow = SchoolStudent & {
  attendance_id: string | null;
  attendance_status: string | null;
};

const STATUSES = ["present", "absent", "late", "excused"] as const;
type AttendanceStatus = (typeof STATUSES)[number];

function statusColor(status: string | null) {
  switch (status) {
    case "present": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "absent": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "late": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "excused": return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    default: return "bg-slate-700/30 text-slate-500 border-slate-700/20";
  }
}

export function AttendanceTab() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    getClasses().then(({ data }) => {
      const list = data?.classes ?? [];
      setClasses(list);
      if (list.length > 0) setSelectedClass(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    getAttendance({ classId: selectedClass, date }).then(({ data, error }) => {
      setLoading(false);
      if (error) addToast({ type: "error", title: "Failed to load attendance", message: error });
      else setRows((data?.students as AttendanceRow[]) ?? []);
    });
  }, [selectedClass, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const mark = async (student: AttendanceRow, status: AttendanceStatus) => {
    setSavingId(student.id);
    const { error } = await saveAttendance({
      student_id: student.id,
      class_id: selectedClass,
      attendance_date: date,
      status,
      notes: null,
    });
    setSavingId(null);
    if (error) {
      addToast({ type: "error", title: "Failed to save attendance", message: error });
    } else {
      setRows((prev) =>
        prev.map((r) => r.id === student.id ? { ...r, attendance_status: status } : r),
      );
    }
  };

  const markBulk = async (status: AttendanceStatus) => {
    if (rows.length === 0) return;
    setBulkSaving(true);
    const { error } = await saveBulkAttendance({
      class_id: selectedClass,
      attendance_date: date,
      status,
      student_ids: rows.map((r) => r.id),
    });
    setBulkSaving(false);
    if (error) {
      addToast({ type: "error", title: "Bulk mark failed", message: error });
    } else {
      addToast({ type: "success", title: `Marked all as ${status}` });
      setRows((prev) => prev.map((r) => ({ ...r, attendance_status: status })));
    }
  };

  const handleExport = () => {
    const className = classes.find((c) => c.id === selectedClass)?.name ?? selectedClass;
    const headers = ["Student", "Admission No", "Status", "Date", "Class"];
    const rowData = rows.map((r) => [
      `${r.first_name} ${r.last_name}`,
      r.admission_number,
      r.attendance_status ?? "not marked",
      date,
      className,
    ]);
    downloadCsv(`attendance-${className}-${date}.csv`, headers, rowData);
  };

  const stats = rows.reduce(
    (acc, r) => {
      const s = r.attendance_status ?? "unmarked";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-50">Attendance</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {!selectedClass ? (
        <EmptyMessage message="Select a class to mark attendance." />
      ) : loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyMessage message="No active students in this class." />
      ) : (
        <>
          {/* Summary + bulk actions */}
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4 text-center text-xs">
              {[
                { label: "Present", key: "present", color: "text-emerald-400" },
                { label: "Absent", key: "absent", color: "text-red-400" },
                { label: "Late", key: "late", color: "text-amber-400" },
                { label: "Excused", key: "excused", color: "text-violet-400" },
                { label: "Unmarked", key: "unmarked", color: "text-slate-500" },
              ].map(({ label, key, color }) => (
                <div key={key}>
                  <div className={`text-2xl font-bold ${color}`}>{stats[key] ?? 0}</div>
                  <div className="text-slate-500">{label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 self-center">Mark all:</span>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={bulkSaving}
                  onClick={() => void markBulk(s)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold capitalize transition-all hover:opacity-80 disabled:opacity-50 ${statusColor(s)}`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={handleExport}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Admission</th>
                  <th className="px-6 py-4">Current status</th>
                  <th className="px-6 py-4">Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-medium text-slate-100">
                      {s.first_name} {s.last_name}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{s.admission_number}</td>
                    <td className="px-6 py-4">
                      {s.attendance_status ? (
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusColor(s.attendance_status)}`}
                        >
                          {s.attendance_status}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {savingId === s.id ? (
                          <span className="text-xs text-slate-500">Saving...</span>
                        ) : (
                          STATUSES.map((status) => (
                            <button
                              key={status}
                              onClick={() => void mark(s, status)}
                              disabled={!!savingId}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition-all hover:opacity-90 disabled:opacity-40 ${
                                s.attendance_status === status
                                  ? statusColor(status)
                                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                              }`}
                            >
                              {status}
                            </button>
                          ))
                        )}
                      </div>
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
