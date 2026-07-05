"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { createSchool, getSchool, type School } from "@/lib/schoolPortal";

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
  const [school, setSchool] = useState<School | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserEmail(user.email ?? null);

      const { data, error } = await getSchool();
      if (error) {
        setError(error);
        setSchool(null);
        setRole(null);
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
  }, [router]);

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
      ) : !school ? (
        <SchoolSetup onCreated={load} />
      ) : (
        children
      )}
    </SchoolContext.Provider>
  );
}

function SchoolSetup({ onCreated }: { onCreated: () => void }) {
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
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-500/10 text-sky-400">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold text-slate-50 md:text-4xl">
              Set up your school portal
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-slate-400">
              Create a school workspace to manage classes, students, staff, attendance, and fees.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 max-w-xl space-y-5 rounded-[28px] border border-slate-800 bg-slate-900/40 p-6 md:p-8"
          >
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
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create school portal"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
