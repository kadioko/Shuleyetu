"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { createSchool, getSchool, type School } from "@/lib/schoolPortal";
import { getWorkspaceSummary } from "@/lib/workspaces";

export type SchoolContextValue = {
  school: School | null;
  role: string | null;
  userEmail: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const SchoolContext = createContext<SchoolContextValue>({
  school: null,
  role: null,
  userEmail: null,
  loading: true,
  error: null,
  refresh: () => {},
});

export function useSchool() {
  return useContext(SchoolContext);
}

export function SchoolProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [school, setSchool] = useState<School | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendorOnly, setVendorOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setVendorOnly(false);

    try {
      const selectedSchoolId = searchParams.get("schoolId");
      if (selectedSchoolId) {
        window.localStorage.setItem("shuleyetu.schoolId", selectedSchoolId);
      }
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      const user = session?.user ?? null;
      if (!user) {
        router.push("/auth/school-login?next=/schools/portal");
        return;
      }
      setUserEmail(user.email ?? null);

      const { data, error } = await getSchool();
      if (error) {
        const { data: summary } = await getWorkspaceSummary();
        if (summary?.hasVendor && !summary.hasSchool) {
          setVendorOnly(true);
          setSchool(null);
          setRole(null);
        } else {
          setError(error);
          setSchool(null);
          setRole(null);
        }
      } else if (data?.school) {
        setSchool(data.school);
        setRole(data.role ?? null);
      } else {
        setSchool(null);
        setRole(null);
      }
    } catch (error) {
      console.error("SchoolContext: failed to load", error);
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to Shuleyetu. Please check your configuration.",
      );
      setSchool(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    void load();
  }, [load]);

  const value: SchoolContextValue = {
    school,
    role,
    userEmail,
    loading,
    error,
    refresh: load,
  };

  return (
    <SchoolContext.Provider value={value}>
      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500/30 border-t-sky-400" />
        </div>
      ) : error ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="inline-flex rounded-full bg-red-500/10 p-4 text-red-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-100">Unable to load school portal</h2>
          <p className="mt-2 max-w-md text-sm text-slate-400">{error}</p>
          <button
            onClick={() => load()}
            className="mt-6 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400"
          >
            Try again
          </button>
        </div>
      ) : vendorOnly ? (
        <WrongSchoolPortal />
      ) : !school ? (
        <SchoolSetup onCreated={load} />
      ) : (
        children
      )}
    </SchoolContext.Provider>
  );
}

function WrongSchoolPortal() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-500/10 text-sky-300">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">
            This account is linked to a vendor store, not a school
          </h1>
          <p className="mt-2 text-slate-400">
            School tools are only available to accounts linked in school users. Continue to the vendor dashboard or ask a school admin to invite this email.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105"
          >
            Open vendor dashboard
          </Link>
          <Link
            href="/auth/school-login?next=/schools/portal"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-semibold text-slate-300 transition-all hover:border-slate-600 hover:text-white"
          >
            Use another account
          </Link>
        </div>
      </div>
    </main>
  );
}

function SchoolSetup({ onCreated }: { onCreated: () => void }) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("School name is required");
      return;
    }
    setSubmitting(true);
    const { error: createError } = await createSchool({
      name: name.trim(),
      region: region.trim(),
      district: district.trim(),
      ward: ward.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
    });
    setSubmitting(false);
    if (createError) {
      setError(createError);
      return;
    }
    onCreated();
  };

  return (
    <main className="flex min-h-screen flex-col">
      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-300">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold text-slate-50 md:text-4xl">
              Your account is not linked to a school yet
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-slate-400">
              If your school already has a portal, ask your school admin to invite or link your email. If you are setting up a new school workspace, you can create it here.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setSetupOpen(true)}
              className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-6 text-left transition-all hover:-translate-y-1 hover:border-amber-300/50 hover:bg-amber-400/15"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-50">Create a new school portal</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Use this if you are authorized to create and manage the school workspace.
              </p>
            </button>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-300">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-50">Join an existing school</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Ask your school admin to add your account email to the school users list.
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 transition-colors hover:text-sky-200"
              >
                Contact Shuleyetu support
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {setupOpen && (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 max-w-xl space-y-5 rounded-[28px] border border-slate-800 bg-slate-900/40 p-6 md:p-8"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-50">Create school portal</h2>
              <p className="mt-1 text-sm text-slate-400">
                This will create a new school workspace and link your account as the school admin.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300" htmlFor="school-name">
                School name
              </label>
              <input
                id="school-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dar es Salaam Primary School"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300" htmlFor="region">
                  Region
                </label>
                <input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Dar es Salaam"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300" htmlFor="district">
                  District
                </label>
                <input
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Kinondoni"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300" htmlFor="ward">
                  Ward
                </label>
                <input
                  id="ward"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="e.g. Mwenge"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +255 712 345 678"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300" htmlFor="email">
                School email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="school@example.com"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300" htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address..."
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create school portal"}
            </button>
          </form>
          )}
        </div>
      </section>
    </main>
  );
}
