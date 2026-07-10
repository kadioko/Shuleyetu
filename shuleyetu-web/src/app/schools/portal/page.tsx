"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSchool } from "./SchoolContext";
import {
  DashboardTab,
  ClassesTab,
  StudentsTab,
  StaffTab,
  AttendanceTab,
  FeesTab,
  AnnouncementsTab,
  ReportsTab,
  SettingsTab,
  TabErrorBoundary,
} from "./components";

type Tab =
  | "dashboard"
  | "classes"
  | "students"
  | "staff"
  | "attendance"
  | "fees"
  | "announcements"
  | "reports"
  | "settings";

const ALL_TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
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

const ROLE_TAB_MAP: Record<string, Tab[]> = {
  admin: ALL_TABS.map((t) => t.id),
  teacher: ["dashboard", "classes", "students", "attendance", "reports"],
  finance: ["dashboard", "fees", "reports"],
  staff: ["dashboard", "staff", "fees", "announcements", "reports"],
  support: ["dashboard", "staff", "fees", "announcements", "reports"],
};

function visibleTabs(role: string | null) {
  const allowed = role ? (ROLE_TAB_MAP[role] ?? ROLE_TAB_MAP.teacher) : ROLE_TAB_MAP.teacher;
  return ALL_TABS.filter((t) => allowed.includes(t.id));
}

export default function SchoolPortalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { school, role, userEmail, loading: schoolLoading } = useSchool();
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
      {/* Header */}
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
              {userEmail && <span className="ml-2 text-slate-500">· {userEmail}</span>}
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
        {/* Sidebar */}
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

        {/* Tab content with error boundaries */}
        <div className="flex-1">
          <TabErrorBoundary>
            {activeTab === "dashboard" && <DashboardTab />}
            {activeTab === "classes" && <ClassesTab />}
            {activeTab === "students" && <StudentsTab />}
            {activeTab === "staff" && <StaffTab />}
            {activeTab === "attendance" && <AttendanceTab />}
            {activeTab === "fees" && <FeesTab />}
            {activeTab === "announcements" && <AnnouncementsTab />}
            {activeTab === "reports" && <ReportsTab />}
            {activeTab === "settings" && <SettingsTab />}
          </TabErrorBoundary>
        </div>
      </div>
    </main>
  );
}
