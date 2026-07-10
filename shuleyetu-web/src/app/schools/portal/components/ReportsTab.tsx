"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { getReports, type SchoolReports } from "@/lib/schoolPortal";
import { Loading, EmptyMessage, SectionCard, Button, downloadCsv } from "./shared";

export function ReportsTab() {
  const [reports, setReports] = useState<SchoolReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const { addToast } = useToast();

  const load = async (d: string) => {
    setLoading(true);
    const { data, error } = await getReports(d);
    setLoading(false);
    if (error) addToast({ type: "error", title: "Failed to load reports", message: error });
    else setReports(data);
  };

  useEffect(() => { void load(date); }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportAttendance = () => {
    if (!reports) return;
    const rows: (string | number)[][] = [];
    for (const [className, statuses] of Object.entries(reports.attendanceSummary)) {
      rows.push([
        className,
        statuses.present ?? 0,
        statuses.absent ?? 0,
        statuses.late ?? 0,
        statuses.excused ?? 0,
        Object.values(statuses).reduce((s, v) => s + v, 0),
      ]);
    }
    downloadCsv(
      `attendance-report-${date}.csv`,
      ["Class", "Present", "Absent", "Late", "Excused", "Total"],
      rows,
    );
  };

  const exportFees = () => {
    if (!reports) return;
    downloadCsv(
      `fees-report-${date}.csv`,
      ["Metric", "Amount (TZS)"],
      [
        ["Total Invoiced", reports.feeSummary.totalInvoiced],
        ["Total Paid", reports.feeSummary.totalPaid],
        ["Total Due", reports.feeSummary.totalDue],
      ],
    );
  };

  const exportEnrollment = () => {
    if (!reports) return;
    const rows = Object.entries(reports.enrollmentSummary)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => [name, count]);
    downloadCsv(
      `enrollment-report-${date}.csv`,
      ["Class", "Students"],
      rows,
    );
  };

  const hasAttendance = reports && Object.keys(reports.attendanceSummary).length > 0;
  const hasEnrollment = reports && Object.keys(reports.enrollmentSummary).length > 0;

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-50">Reports</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
        />
      </div>

      {/* Fee summary */}
      {reports && (
        <SectionCard
          title="Fee collection summary"
          action={
            <Button size="sm" variant="secondary" onClick={exportFees}>
              Export CSV
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total invoiced", value: reports.feeSummary.totalInvoiced, color: "text-slate-200" },
              { label: "Total paid", value: reports.feeSummary.totalPaid, color: "text-emerald-400" },
              { label: "Total due", value: reports.feeSummary.totalDue, color: "text-amber-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`mt-1 text-xl font-bold ${color}`}>
                  TZS {value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Attendance summary */}
      <SectionCard
        title={`Attendance summary — ${new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
        action={
          hasAttendance ? (
            <Button size="sm" variant="secondary" onClick={exportAttendance}>
              Export CSV
            </Button>
          ) : undefined
        }
      >
        {!hasAttendance ? (
          <EmptyMessage message="No attendance recorded for this date." />
        ) : (
          <div className="space-y-4">
            {Object.entries(reports!.attendanceSummary).map(([className, statuses]) => {
              const total = Object.values(statuses).reduce((s, v) => s + v, 0);
              const present = statuses.present ?? 0;
              const rate = total > 0 ? Math.round((present / total) * 100) : 0;
              return (
                <div key={className} className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-100">{className}</p>
                    <span className={`text-sm font-bold ${rate >= 80 ? "text-emerald-400" : rate >= 60 ? "text-amber-400" : "text-red-400"}`}>
                      {rate}% present
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
                      <div className="font-bold">{statuses.present ?? 0}</div>
                      <div className="text-slate-500">Present</div>
                    </div>
                    <div className="rounded-xl bg-red-500/10 p-2 text-red-400">
                      <div className="font-bold">{statuses.absent ?? 0}</div>
                      <div className="text-slate-500">Absent</div>
                    </div>
                    <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
                      <div className="font-bold">{statuses.late ?? 0}</div>
                      <div className="text-slate-500">Late</div>
                    </div>
                    <div className="rounded-xl bg-sky-500/10 p-2 text-sky-400">
                      <div className="font-bold">{statuses.excused ?? 0}</div>
                      <div className="text-slate-500">Excused</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Enrollment */}
      <SectionCard
        title="Enrollment by class"
        action={
          hasEnrollment ? (
            <Button size="sm" variant="secondary" onClick={exportEnrollment}>
              Export CSV
            </Button>
          ) : undefined
        }
      >
        {!hasEnrollment ? (
          <EmptyMessage message="No students enrolled yet." />
        ) : (
          <ul className="divide-y divide-slate-800">
            {Object.entries(reports!.enrollmentSummary)
              .sort((a, b) => b[1] - a[1])
              .map(([className, count]) => (
                <li key={className} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-slate-100">{className}</span>
                  <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-300">
                    {count}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
