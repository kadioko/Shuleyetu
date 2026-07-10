"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  getClasses,
  getStudents,
  getAttendance,
  saveAttendance,
  saveBulkAttendance,
  getStudentAttendanceHistory,
  type SchoolClass,
  type SchoolStudent,
  type SchoolAttendanceRecord,
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

type TabMode = "mark" | "history";

export function AttendanceTab() {
  const [mode, setMode] = useState<TabMode>("mark");
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { addToast } = useToast();

  // History mode state
  const [allStudents, setAllStudents] = useState<SchoolStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [historyDateFrom, setHistoryDateFrom] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [historyDateTo, setHistoryDateTo] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [historyRecords, setHistoryRecords] = useState<SchoolAttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    getClasses().then(({ data }) => {
      const list = data?.classes ?? [];
      setClasses(list);
      if (list.length > 0) setSelectedClass(list[0].id);
    });
  }, []);

  // Load students for history mode
  useEffect(() => {
    if (mode === "history") {
      getStudents({ classId: selectedClass || undefined }).then(({ data }) => {
        setAllStudents(data?.students ?? []);
      });
    }
  }, [mode, selectedClass]);

  useEffect(() => {
    if (mode !== "mark" || !selectedClass) return;
    setLoading(true);
    getAttendance({ classId: selectedClass, date }).then(({ data, error }) => {
      setLoading(false);
      if (error) addToast({ type: "error", title: "Failed to load attendance", message: error });
      else setRows((data?.students as AttendanceRow[]) ?? []);
    });
  }, [selectedClass, date, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHistory = async () => {
    if (!selectedStudentId) return;
    setHistoryLoading(true);
    const { data, error } = await getStudentAttendanceHistory({
      studentId: selectedStudentId,
      dateFrom: historyDateFrom,
      dateTo: historyDateTo,
    });
    setHistoryLoading(false);
    if (error) {
      addToast({ type: "error", title: "Failed to load history", message: error });
    } else {
      setHistoryRecords(data?.records ?? []);
    }
  };

  useEffect(() => {
    if (mode === "history" && selectedStudentId) {
      void loadHistory();
    }
  }, [selectedStudentId, historyDateFrom, historyDateTo, mode]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleHistoryExport = () => {
    const student = allStudents.find((s) => s.id === selectedStudentId);
    const studentName = student ? `${student.first_name}-${student.last_name}` : selectedStudentId;
    const headers = ["Date", "Class", "Status", "Notes"];
    const rowData = historyRecords.map((r) => [
      r.attendance_date,
      r.class_name ?? "",
      r.status,
      r.notes ?? "",
    ]);
    downloadCsv(`attendance-history-${studentName}-${historyDateFrom}-to-${historyDateTo}.csv`, headers, rowData);
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
          {mode === "mark" && (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
            />
          )}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 rounded-2xl border border-slate-800 bg-slate-900/40 p-1 w-fit">
        <button
          onClick={() => setMode("mark")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            mode === "mark"
              ? "bg-sky-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Mark attendance
        </button>
        <button
          onClick={() => setMode("history")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            mode === "history"
              ? "bg-sky-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Student history
        </button>
      </div>

      {mode === "mark" && (
        <>
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
        </>
      )}

      {mode === "history" && (
        <>
          {/* Student selector and date range */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
            >
              <option value="">Select student</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} ({s.admission_number})
                </option>
              ))}
            </select>
            <input
              type="date"
              value={historyDateFrom}
              onChange={(e) => setHistoryDateFrom(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
            />
            <span className="text-xs text-slate-500">to</span>
            <input
              type="date"
              value={historyDateTo}
              onChange={(e) => setHistoryDateTo(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
            />
          </div>

          {!selectedStudentId ? (
            <EmptyMessage message="Select a student to view their attendance history." />
          ) : historyLoading ? (
            <Loading />
          ) : historyRecords.length === 0 ? (
            <EmptyMessage message="No attendance records found for this period." />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {historyRecords.length} record{historyRecords.length !== 1 ? "s" : ""} found
                </p>
                <button
                  onClick={handleHistoryExport}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10"
                >
                  Export CSV
                </button>
              </div>
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-800 bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Class</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {historyRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-slate-300">{r.attendance_date}</td>
                        <td className="px-6 py-4 text-slate-400">{r.class_name ?? "—"}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusColor(r.status)}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{r.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
