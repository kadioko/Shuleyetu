"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/Chart";
import { useToast } from "@/components/ui/Toast";
import { getOverview, seedDemoData, type SchoolOverview } from "@/lib/schoolPortal";
import { Loading, ErrorMessage, EmptyMessage, SectionCard, Badge } from "./shared";

type Tab =
  | "dashboard" | "classes" | "students" | "staff"
  | "attendance" | "fees" | "announcements" | "settings" | "reports";

export function DashboardTab() {
  const [overview, setOverview] = useState<SchoolOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const { addToast } = useToast();

  const loadOverview = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    getOverview().then(({ data, error }) => {
      if (cancelled) return;
      setLoading(false);
      if (error) setError(error);
      else setOverview(data);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return loadOverview();
  }, [loadOverview]);

  const handleSeed = async () => {
    setSeeding(true);
    const { data, error } = await seedDemoData();
    setSeeding(false);
    if (error) {
      addToast({ type: "error", title: "Demo data failed", message: error });
    } else {
      addToast({
        type: "success",
        title: "Demo data loaded",
        message: `Added ${data?.students} students, ${data?.classes} classes, and ${data?.fees} fees.`,
      });
      loadOverview();
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!overview) return <EmptyMessage message="No overview data available" />;

  const isEmpty = overview.classes === 0 && overview.students === 0;

  const onboardingSteps: { label: string; done: boolean; tab?: Tab }[] = [
    { label: "Create school", done: true },
    { label: "Add classes", done: overview.classes > 0, tab: "classes" },
    { label: "Add students", done: overview.students > 0, tab: "students" },
    { label: "Add staff", done: overview.staff > 0, tab: "staff" },
    {
      label: "Start attendance/fees",
      done: overview.attendanceToday > 0 || overview.feesDue > 0,
      tab: "attendance",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Setup progress */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-50">School setup progress</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Build your portal in a few practical steps, then use quick actions for daily work.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onboardingSteps.map((step) => {
              const cls = `rounded-2xl border px-3 py-2 text-xs font-semibold transition-all ${
                step.done
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15"
              }`;
              return step.tab ? (
                <Link key={step.label} href={`/schools/portal?tab=${step.tab}`} className={cls}>
                  {step.done ? "Done" : "Next"}: {step.label}
                </Link>
              ) : (
                <span key={step.label} className={cls}>
                  {step.done ? "Done" : "Next"}: {step.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Add class", tab: "classes" },
          { label: "Add student", tab: "students" },
          { label: "Add staff", tab: "staff" },
          { label: "Mark attendance", tab: "attendance" },
          { label: "Create fee", tab: "fees" },
        ].map((action) => (
          <Link
            key={action.tab}
            href={`/schools/portal?tab=${action.tab}`}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition-all hover:border-sky-400/30 hover:text-sky-300"
          >
            {action.label}
          </Link>
        ))}
      </div>

      {/* Demo data banner */}
      {isEmpty && (
        <div className="rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-50">Showcase demo data</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Load a sample school with classes, students, staff, attendance, fees, and
                announcements to explore the portal.
              </p>
            </div>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-sky-400 disabled:opacity-60"
            >
              {seeding ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Loading...
                </>
              ) : (
                "Load demo data"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Classes"
          value={overview.classes}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        <StatCard
          title="Active Students"
          value={overview.students}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
        />
        <StatCard
          title="Active Staff"
          value={overview.staff}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Fees Due (net)"
          value={`TZS ${overview.feesDue.toLocaleString()}`}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Recents */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Recent students">
          {overview.recentStudents.length === 0 ? (
            <EmptyMessage message="No students added yet" />
          ) : (
            <ul className="divide-y divide-slate-800">
              {overview.recentStudents.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {s.first_name} {s.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{s.admission_number}</p>
                  </div>
                  <Badge variant={s.status as "active" | "inactive"}>{s.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent announcements">
          {overview.recentAnnouncements.length === 0 ? (
            <EmptyMessage message="No announcements yet" />
          ) : (
            <ul className="divide-y divide-slate-800">
              {overview.recentAnnouncements.map((a) => (
                <li key={a.id} className="py-3">
                  <p className="text-sm font-medium text-slate-100">{a.title}</p>
                  <p className="text-xs text-slate-500 capitalize">{a.audience}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
