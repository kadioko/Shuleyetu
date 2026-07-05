"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StatCard } from "@/components/ui/Chart";
import { useToast } from "@/components/ui/Toast";
import { useSchool } from "./SchoolContext";
import {
  getOverview,
  seedDemoData,
  getSchoolSettings,
  updateSchoolSettings,
  getReports,
  getClasses,
  createClass,
  getStudents,
  createStudent,
  getStaff,
  createStaff,
  getAttendance,
  saveAttendance,
  getFees,
  createFee,
  getAnnouncements,
  createAnnouncement,
  type SchoolClass,
  type SchoolStudent,
  type SchoolStaff,
  type SchoolFee,
  type SchoolAnnouncement,
  type SchoolOverview,
  type SchoolReports,
  type School,
} from "@/lib/schoolPortal";

type Tab =
  | "dashboard"
  | "classes"
  | "students"
  | "staff"
  | "attendance"
  | "fees"
  | "announcements"
  | "settings"
  | "reports";

function visibleTabs(role: string | null) {
  const allTabs = tabs;
  if (role === "admin") return allTabs;
  if (role === "teacher") {
    return allTabs.filter((t) =>
      ["dashboard", "classes", "students", "attendance", "reports"].includes(t.id),
    );
  }
  // staff / support / default
  return allTabs.filter((t) =>
    ["dashboard", "classes", "students", "staff", "attendance", "fees", "announcements", "reports"].includes(t.id),
  );
}

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "classes",
    label: "Classes",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "students",
    label: "Students",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
  },
  {
    id: "staff",
    label: "Staff",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "fees",
    label: "Fees",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "announcements",
    label: "Announcements",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    id: "reports",
    label: "Reports",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function SchoolPortalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { school, role, userEmail, loading: schoolLoading, refresh } = useSchool();
  const availableTabs = visibleTabs(role);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  useEffect(() => {
    const tab = searchParams.get("tab") as Tab | null;
    if (tab && availableTabs.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, availableTabs]);

  useEffect(() => {
    if (!availableTabs.some((t) => t.id === activeTab)) {
      setActiveTab("dashboard");
      router.replace(`/schools/portal?tab=dashboard`, { scroll: false });
    }
  }, [activeTab, availableTabs, router]);

  const handleTabChange = (tab: Tab) => {
    if (!availableTabs.some((t) => t.id === tab)) return;
    setActiveTab(tab);
    router.replace(`/schools/portal?tab=${tab}`, { scroll: false });
  };

  if (schoolLoading || !school) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500/30 border-t-sky-400" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6 md:py-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
              <span className="capitalize">{role ?? "Member"}</span>
              <span>·</span>
              <span>School Portal</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-slate-50 md:text-4xl">
              {school.name}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {school.region && `${school.region}, `}
              {school.district && `${school.district}`}
              {userEmail && (
                <span className="ml-2 text-slate-500">· {userEmail}</span>
              )}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-sky-400/30 hover:text-sky-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Shuleyetu
          </Link>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:px-6 md:py-8">
        {/* Sidebar / mobile tabs */}
        <aside className="md:w-64 md:flex-shrink-0">
          <nav className="sticky top-24 flex flex-col gap-1 rounded-3xl border border-slate-800 bg-slate-900/40 p-2">
            {availableTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? "bg-sky-500/10 text-sky-300 shadow-[inset_0_1px_0_rgba(125,211,252,0.2)]"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "classes" && <ClassesTab />}
          {activeTab === "students" && <StudentsTab />}
          {activeTab === "staff" && <StaffTab />}
          {activeTab === "attendance" && <AttendanceTab />}
          {activeTab === "fees" && <FeesTab />}
          {activeTab === "announcements" && <AnnouncementsTab />}
          {activeTab === "reports" && <ReportsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>
    </main>
  );
}

// ---------- Dashboard ----------

function DashboardTab() {
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
    return () => {
      cancelled = true;
    };
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

  return (
    <div className="space-y-6">
      {isEmpty && (
        <div className="rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-50">Showcase demo data</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Load a sample school with classes, students, staff, attendance, fees, and announcements to explore the portal.
              </p>
            </div>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:opacity-60"
            >
              {seeding ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                  Loading...
                </>
              ) : (
                "Load demo data"
              )}
            </button>
          </div>
        </div>
      )}

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
          title="Fees Due"
          value={`TZS ${overview.feesDue.toLocaleString()}`}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

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
                  <Badge>{s.status}</Badge>
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

// ---------- Classes ----------

function ClassesTab() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await getClasses();
    setLoading(false);
    if (error) setError(error);
    else setClasses(data?.classes ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { error } = await createClass({
      name: String(fd.get("name") ?? "").trim(),
      grade: String(fd.get("grade") ?? "").trim() || null,
      stream: String(fd.get("stream") ?? "").trim() || null,
      room: String(fd.get("room") ?? "").trim() || null,
      capacity: Number(fd.get("capacity")) || null,
    });
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      setFormOpen(false);
      form.reset();
      void load();
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-50">Classes</h2>
        <Button onClick={() => setFormOpen(!formOpen)}>
          {formOpen ? "Close" : "Add class"}
        </Button>
      </div>

      {formOpen && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="name" label="Class name" placeholder="e.g. Standard 7A" required />
            <Input name="grade" label="Grade" placeholder="e.g. Standard 7" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input name="stream" label="Stream" placeholder="e.g. A" />
            <Input name="room" label="Room" placeholder="e.g. Room 4" />
            <Input name="capacity" type="number" label="Capacity" placeholder="40" />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex gap-3">
            <SubmitButton loading={submitting}>Save class</SubmitButton>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {classes.length === 0 ? (
        <EmptyMessage message="No classes yet. Add your first class to get started." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Grade</th>
                <th className="px-6 py-4">Stream</th>
                <th className="px-6 py-4">Room</th>
                <th className="px-6 py-4">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {classes.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-medium text-slate-100">{c.name}</td>
                  <td className="px-6 py-4 text-slate-400">{c.grade ?? "—"}</td>
                  <td className="px-6 py-4 text-slate-400">{c.stream ?? "—"}</td>
                  <td className="px-6 py-4 text-slate-400">{c.room ?? "—"}</td>
                  <td className="px-6 py-4 text-slate-400">{c.capacity ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Students ----------

function StudentsTab() {
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: classesData }, { data: studentsData }] = await Promise.all([
      getClasses(),
      getStudents({ classId: filterClass || undefined, status: "active" }),
    ]);
    setLoading(false);
    setClasses(classesData?.classes ?? []);
    setStudents(studentsData?.students ?? []);
  }, [filterClass]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { error } = await createStudent({
      admission_number: String(fd.get("admission_number")).trim(),
      first_name: String(fd.get("first_name")).trim(),
      last_name: String(fd.get("last_name")).trim(),
      gender: String(fd.get("gender")) as SchoolStudent["gender"],
      date_of_birth: String(fd.get("date_of_birth")) || null,
      class_id: String(fd.get("class_id")) || null,
      parent_name: String(fd.get("parent_name")).trim() || null,
      parent_phone: String(fd.get("parent_phone")).trim() || null,
      parent_email: String(fd.get("parent_email")).trim() || null,
      address: String(fd.get("address")).trim() || null,
      enrollment_date: String(fd.get("enrollment_date")) || null,
    });
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      setFormOpen(false);
      form.reset();
      void load();
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-50">Students</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button onClick={() => setFormOpen(!formOpen)}>
            {formOpen ? "Close" : "Add student"}
          </Button>
        </div>
      </div>

      {formOpen && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="admission_number" label="Admission number" required />
            <Input name="enrollment_date" type="date" label="Enrollment date" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input name="first_name" label="First name" required />
            <Input name="last_name" label="Last name" required />
            <Select name="gender" label="Gender" options={["", "male", "female", "other"]} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="date_of_birth" type="date" label="Date of birth" />
            <select
              name="class_id"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none focus:border-sky-500"
            >
              <option value="">No class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="parent_name" label="Parent / guardian name" />
            <Input name="parent_phone" label="Parent phone" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="parent_email" type="email" label="Parent email" />
            <Input name="address" label="Address" />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex gap-3">
            <SubmitButton loading={submitting}>Save student</SubmitButton>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {students.length === 0 ? (
        <EmptyMessage message="No students found. Add a student to start tracking." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Admission</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">Parent phone</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-slate-400">{s.admission_number}</td>
                  <td className="px-6 py-4 font-medium text-slate-100">
                    {s.first_name} {s.last_name}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {s.school_classes?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-400 capitalize">{s.gender ?? "—"}</td>
                  <td className="px-6 py-4 text-slate-400">{s.parent_phone ?? "—"}</td>
                  <td className="px-6 py-4">
                    <Badge>{s.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Staff ----------

function StaffTab() {
  const [staff, setStaff] = useState<SchoolStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await getStaff();
    setLoading(false);
    if (error) setError(error);
    else setStaff(data?.staff ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { error } = await createStaff({
      employee_id: String(fd.get("employee_id")).trim() || null,
      first_name: String(fd.get("first_name")).trim(),
      last_name: String(fd.get("last_name")).trim(),
      email: String(fd.get("email")).trim() || null,
      phone: String(fd.get("phone")).trim() || null,
      role: String(fd.get("role")) as SchoolStaff["role"],
      subject: String(fd.get("subject")).trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      setFormOpen(false);
      form.reset();
      void load();
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-50">Staff</h2>
        <Button onClick={() => setFormOpen(!formOpen)}>
          {formOpen ? "Close" : "Add staff"}
        </Button>
      </div>

      {formOpen && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="employee_id" label="Employee ID" />
            <Select name="role" label="Role" options={["teacher", "admin", "support"]} required />
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
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex gap-3">
            <SubmitButton loading={submitting}>Save staff</SubmitButton>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {staff.length === 0 ? (
        <EmptyMessage message="No staff yet. Add teachers and administrators to manage the school." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40">
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
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-slate-400">{s.employee_id ?? "—"}</td>
                  <td className="px-6 py-4 font-medium text-slate-100">
                    {s.first_name} {s.last_name}
                  </td>
                  <td className="px-6 py-4 text-slate-400 capitalize">{s.role}</td>
                  <td className="px-6 py-4 text-slate-400">{s.subject ?? "—"}</td>
                  <td className="px-6 py-4 text-slate-400">{s.phone ?? "—"}</td>
                  <td className="px-6 py-4">
                    <Badge>{s.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Attendance ----------

type AttendanceRow = SchoolStudent & {
  attendance_id: string | null;
  attendance_status: string | null;
};

function AttendanceTab() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    getClasses().then(({ data }) => {
      const list = data?.classes ?? [];
      setClasses(list);
      if (list.length > 0 && !selectedClass) setSelectedClass(list[0].id);
    });
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    getAttendance({ classId: selectedClass, date }).then(({ data, error }) => {
      setLoading(false);
      if (error) setError(error);
      else setRows((data?.students as AttendanceRow[]) ?? []);
    });
  }, [selectedClass, date]);

  const mark = async (student: AttendanceRow, status: string) => {
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
      setError(error);
    } else {
      setRows((prev) =>
        prev.map((r) =>
          r.id === student.id ? { ...r, attendance_status: status } : r,
        ),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-50">Attendance</h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
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

      {error && <p className="text-sm text-red-300">{error}</p>}

      {!selectedClass ? (
        <EmptyMessage message="Select a class to mark attendance." />
      ) : loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyMessage message="No active students in this class." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Admission</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
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
                      <Badge className={attendanceColor(s.attendance_status)}>
                        {s.attendance_status}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-500">Not marked</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {["present", "absent", "late", "excused"].map((status) => (
                        <button
                          key={status}
                          disabled={savingId === s.id}
                          onClick={() => mark(s, status)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                            s.attendance_status === status
                              ? "bg-sky-500/20 text-sky-300"
                              : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100"
                          }`}
                        >
                          {savingId === s.id && s.attendance_status !== status
                            ? "..."
                            : status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function attendanceColor(status: string | null) {
  switch (status) {
    case "present":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "absent":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "late":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "excused":
      return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    default:
      return "";
  }
}

// ---------- Fees ----------

function FeesTab() {
  const [fees, setFees] = useState<SchoolFee[]>([]);
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: feesData }, { data: studentsData }] = await Promise.all([
      getFees(),
      getStudents({ status: "active" }),
    ]);
    setLoading(false);
    setFees(feesData?.fees ?? []);
    setStudents(studentsData?.students ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { error } = await createFee({
      student_id: String(fd.get("student_id")),
      description: String(fd.get("description")).trim(),
      amount_tzs: Number(fd.get("amount_tzs")),
      due_date: String(fd.get("due_date")) || null,
    });
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      setFormOpen(false);
      form.reset();
      void load();
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-50">Fees</h2>
        <Button onClick={() => setFormOpen(!formOpen)}>
          {formOpen ? "Close" : "Add fee"}
        </Button>
      </div>

      {formOpen && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Input name="amount_tzs" type="number" label="Amount (TZS)" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="description" label="Description" placeholder="e.g. Tuition Term 1" required />
            <Input name="due_date" type="date" label="Due date" />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex gap-3">
            <SubmitButton loading={submitting}>Save fee</SubmitButton>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {fees.length === 0 ? (
        <EmptyMessage message="No fees recorded. Add the first fee invoice." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Paid</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {fees.map((f) => (
                <tr key={f.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-medium text-slate-100">
                    {f.school_students?.first_name} {f.school_students?.last_name}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{f.description}</td>
                  <td className="px-6 py-4 text-right text-slate-300">
                    TZS {Number(f.amount_tzs).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-400">
                    TZS {f.paid_tzs.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300">
                    TZS {f.balance_tzs.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge>{f.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Announcements ----------

function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await getAnnouncements();
    setLoading(false);
    if (error) setError(error);
    else setAnnouncements(data?.announcements ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { error } = await createAnnouncement({
      title: String(fd.get("title")).trim(),
      content: String(fd.get("content")).trim(),
      audience: String(fd.get("audience")) as SchoolAnnouncement["audience"],
    });
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      setFormOpen(false);
      form.reset();
      void load();
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-50">Announcements</h2>
        <Button onClick={() => setFormOpen(!formOpen)}>
          {formOpen ? "Close" : "New announcement"}
        </Button>
      </div>

      {formOpen && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="title" label="Title" required />
            <Select name="audience" label="Audience" options={["all", "parents", "staff", "students"]} required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300" htmlFor="content">
              Content
            </label>
            <textarea
              id="content"
              name="content"
              rows={5}
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="Write the announcement here..."
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex gap-3">
            <SubmitButton loading={submitting}>Publish</SubmitButton>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {announcements.length === 0 ? (
        <EmptyMessage message="No announcements yet. Publish one to share with your school community." />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:border-sky-500/30"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-100">{a.title}</h3>
                <Badge className="capitalize">{a.audience}</Badge>
                <span className="ml-auto text-xs text-slate-500">
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {a.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Reports ----------

function ReportsTab() {
  const [reports, setReports] = useState<SchoolReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getReports(date);
    setLoading(false);
    if (error) setError(error);
    else setReports(data);
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!reports) return <EmptyMessage message="No reports available" />;

  const classes = Object.keys(reports.attendanceSummary);
  const hasAttendance = classes.length > 0;
  const hasEnrollment = Object.keys(reports.enrollmentSummary).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-50">Reports</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400" htmlFor="report-date">
            Date
          </label>
          <input
            id="report-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SectionCard title="Total Invoiced">
          <p className="text-2xl font-bold text-slate-50">
            TZS {reports.feeSummary.totalInvoiced.toLocaleString()}
          </p>
        </SectionCard>
        <SectionCard title="Total Paid">
          <p className="text-2xl font-bold text-emerald-400">
            TZS {reports.feeSummary.totalPaid.toLocaleString()}
          </p>
        </SectionCard>
        <SectionCard title="Total Due">
          <p className="text-2xl font-bold text-amber-400">
            TZS {reports.feeSummary.totalDue.toLocaleString()}
          </p>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={`Attendance summary for ${reports.date}`}>
          {!hasAttendance ? (
            <EmptyMessage message="No attendance records for this date." />
          ) : (
            <div className="space-y-4">
              {classes.map((className) => {
                const stats = reports.attendanceSummary[className];
                const total =
                  stats.present + stats.absent + stats.late + stats.excused;
                return (
                  <div key={className} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-semibold text-slate-100">{className}</h4>
                      <span className="text-xs text-slate-500">{total} students</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
                        <div className="font-bold">{stats.present}</div>
                        <div className="text-slate-500">Present</div>
                      </div>
                      <div className="rounded-xl bg-red-500/10 p-2 text-red-400">
                        <div className="font-bold">{stats.absent}</div>
                        <div className="text-slate-500">Absent</div>
                      </div>
                      <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
                        <div className="font-bold">{stats.late}</div>
                        <div className="text-slate-500">Late</div>
                      </div>
                      <div className="rounded-xl bg-sky-500/10 p-2 text-sky-400">
                        <div className="font-bold">{stats.excused}</div>
                        <div className="text-slate-500">Excused</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Enrollment by class">
          {!hasEnrollment ? (
            <EmptyMessage message="No students enrolled yet." />
          ) : (
            <ul className="divide-y divide-slate-800">
              {Object.entries(reports.enrollmentSummary)
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
    </div>
  );
}

// ---------- Settings ----------

function SettingsTab() {
  const { school: contextSchool, refresh } = useSchool();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (contextSchool) {
      setSchool(contextSchool);
      setLoading(false);
    } else {
      setLoading(true);
      getSchoolSettings().then(({ data, error }) => {
        setLoading(false);
        if (error) setError(error);
        else setSchool(data?.school ?? null);
      });
    }
  }, [contextSchool]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { data, error: updateError } = await updateSchoolSettings({
      name: String(fd.get("name")).trim(),
      region: String(fd.get("region")).trim(),
      district: String(fd.get("district")).trim(),
      ward: String(fd.get("ward")).trim(),
      phone: String(fd.get("phone")).trim(),
      email: String(fd.get("email")).trim(),
      address: String(fd.get("address")).trim(),
    });
    setSaving(false);
    if (updateError) {
      setError(updateError);
      addToast({ type: "error", title: "Save failed", message: updateError });
    } else {
      setSchool(data?.school ?? null);
      refresh();
      addToast({ type: "success", title: "Settings saved", message: "School details updated successfully." });
      form.reset();
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!school) return <EmptyMessage message="No school found" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-50">School settings</h2>

      <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 md:p-8">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300" htmlFor="settings-name">
            School name
          </label>
          <input
            id="settings-name"
            name="name"
            defaultValue={school.name}
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300" htmlFor="settings-region">
              Region
            </label>
            <input
              id="settings-region"
              name="region"
              defaultValue={school.region ?? ""}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300" htmlFor="settings-district">
              District
            </label>
            <input
              id="settings-district"
              name="district"
              defaultValue={school.district ?? ""}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300" htmlFor="settings-ward">
              Ward
            </label>
            <input
              id="settings-ward"
              name="ward"
              defaultValue={school.ward ?? ""}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300" htmlFor="settings-phone">
              Phone
            </label>
            <input
              id="settings-phone"
              name="phone"
              defaultValue={school.phone ?? ""}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300" htmlFor="settings-email">
            School email
          </label>
          <input
            id="settings-email"
            name="email"
            type="email"
            defaultValue={school.email ?? ""}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300" htmlFor="settings-address">
            Address
          </label>
          <textarea
            id="settings-address"
            name="address"
            rows={3}
            defaultValue={school.address ?? ""}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <div className="flex gap-3">
          <SubmitButton loading={saving}>Save settings</SubmitButton>
        </div>
      </form>
    </div>
  );
}

// ---------- Shared UI components ----------

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Input({
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      />
    </div>
  );
}

function Select({
  name,
  label,
  options,
  required,
}: {
  name: string;
  label: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none focus:border-sky-500"
      >
        {options.map((o) => (
          <option key={o} value={o} className="capitalize">
            {o ? o : `Select ${label.toLowerCase()}`}
          </option>
        ))}
      </select>
    </div>
  );
}

function Button({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] hover:shadow-sky-500/30"
    >
      {children}
    </button>
  );
}

function SubmitButton({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] disabled:opacity-60"
    >
      {loading ? "Saving..." : children}
    </button>
  );
}

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium capitalize text-slate-300 ${className}`}
    >
      {children}
    </span>
  );
}

function Loading() {
  return (
    <div className="flex min-h-[24rem] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500/30 border-t-sky-400" />
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-[16rem] items-center justify-center">
      <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center text-red-200">
        {message}
      </div>
    </div>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
