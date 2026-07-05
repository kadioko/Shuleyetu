"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getWorkspaceSummary, type WorkspaceSummary } from "@/lib/workspaces";

export default function WorkspacesPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<WorkspaceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await getWorkspaceSummary();
      setLoading(false);
      if (error || !data) {
        setError(error ?? "Unable to load your workspaces.");
        return;
      }
      setSummary(data);
    };

    void load();
  }, []);

  useEffect(() => {
    if (!summary) return;
    const accessCount =
      Number(summary.hasVendor) + Number(summary.hasSchool) + Number(summary.isAdmin);
    if (accessCount === 0) router.replace("/auth/login");
  }, [router, summary]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500/30 border-t-sky-400" />
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-red-950/20 p-8 text-center">
          <h1 className="text-xl font-bold text-red-100">Workspace error</h1>
          <p className="mt-2 text-sm text-red-200/80">{error}</p>
          <Link href="/auth/login" className="mt-5 inline-flex rounded-2xl bg-red-500/20 px-5 py-2.5 text-sm font-semibold text-red-100">
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-16 md:px-6">
      <section className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            Workspace switcher
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold text-slate-50 md:text-5xl">
            Choose where to continue
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            This account has access to more than one Shuleyetu area. Pick the workspace you want to use now.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {summary.hasVendor && (
            <Link href="/dashboard" className="rounded-3xl border border-sky-500/25 bg-sky-500/10 p-6 transition-all hover:-translate-y-1 hover:border-sky-400/45">
              <h2 className="text-xl font-bold text-slate-50">Vendor Dashboard</h2>
              <p className="mt-2 text-sm text-slate-300">
                {summary.vendors.length === 1
                  ? summary.vendors[0]?.name
                  : `${summary.vendors.length} vendor stores`}
              </p>
              <p className="mt-5 text-sm font-semibold text-sky-300">Open vendor workspace</p>
            </Link>
          )}

          {summary.hasSchool && (
            <Link href={`/schools/portal?schoolId=${summary.schools[0]?.id ?? ""}`} className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-6 transition-all hover:-translate-y-1 hover:border-amber-300/50">
              <h2 className="text-xl font-bold text-slate-50">School Portal</h2>
              <p className="mt-2 text-sm text-slate-300">
                {summary.schools.length === 1
                  ? `${summary.schools[0]?.name} (${summary.schools[0]?.role})`
                  : `${summary.schools.length} school workspaces`}
              </p>
              <p className="mt-5 text-sm font-semibold text-amber-200">Open school workspace</p>
            </Link>
          )}

          {summary.isAdmin && (
            <Link href="/admin" className="rounded-3xl border border-fuchsia-400/25 bg-fuchsia-400/10 p-6 transition-all hover:-translate-y-1 hover:border-fuchsia-300/45">
              <h2 className="text-xl font-bold text-slate-50">Admin Panel</h2>
              <p className="mt-2 text-sm text-slate-300">Manage platform-level access and vendors.</p>
              <p className="mt-5 text-sm font-semibold text-fuchsia-200">Open admin</p>
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
