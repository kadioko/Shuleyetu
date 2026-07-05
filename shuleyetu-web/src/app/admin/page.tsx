"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type Vendor = {
  id: string;
  name: string | null;
};

type VendorUserLink = {
  user_id: string;
  email: string | null;
  vendor_id: string;
  vendor_name: string | null;
  created_at: string;
};

type AdminRow = {
  user_id: string;
  email: string | null;
};

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  const [vendorUsers, setVendorUsers] = useState<VendorUserLink[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [currentAdminUserId, setCurrentAdminUserId] = useState<string | null>(null);
  const [loadingManagement, setLoadingManagement] = useState(false);
  const [unlinkingKey, setUnlinkingKey] = useState<string | null>(null);
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);

  const [grantEmail, setGrantEmail] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = async () => {
      setAdminChecked(false);
      setError(null);

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      const accessToken = session?.access_token ?? "";
      if (!accessToken) {
        setAdminChecked(true);
        setIsAdmin(false);
        return;
      }

      const res = await fetch("/api/admin/check", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json().catch(() => null);
      setIsAdmin(Boolean(data?.isAdmin));
      setAdminChecked(true);
    };

    void check();
  }, []);

  useEffect(() => {
    const loadVendors = async () => {
      if (!adminChecked || !isAdmin) return;

      setLoadingVendors(true);
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        const accessToken = session?.access_token ?? "";
        if (!accessToken) {
          setLoadingVendors(false);
          return;
        }

        const res = await fetch("/api/admin/vendors", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.error || "Failed to load vendors.");
          setLoadingVendors(false);
          return;
        }

        setVendors((data?.vendors as Vendor[]) ?? []);
      } catch (err) {
        console.error("Error loading vendors", err);
        setError("Failed to load vendors.");
      } finally {
        setLoadingVendors(false);
      }
    };

    void loadVendors();
  }, [adminChecked, isAdmin]);

  const refreshManagement = useCallback(async () => {
    if (!adminChecked || !isAdmin) return;

    setLoadingManagement(true);
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      const accessToken = session?.access_token ?? "";
      if (!accessToken) {
        setLoadingManagement(false);
        return;
      }

      const [vendorUsersRes, adminsRes] = await Promise.all([
        fetch("/api/admin/vendor-users", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
        fetch("/api/admin/admins", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      ]);

      const vendorUsersData = await vendorUsersRes.json().catch(() => null);
      if (vendorUsersRes.ok) {
        setVendorUsers((vendorUsersData?.vendorUsers as VendorUserLink[]) ?? []);
      } else {
        setError(vendorUsersData?.error || "Failed to load vendor-user links.");
      }

      const adminsData = await adminsRes.json().catch(() => null);
      if (adminsRes.ok) {
        setAdmins((adminsData?.admins as AdminRow[]) ?? []);
        setCurrentAdminUserId((adminsData?.currentUserId as string) ?? null);
      } else {
        setError(adminsData?.error || "Failed to load admins.");
      }
    } catch (e) {
      console.error("Failed to refresh management data", e);
      setError("Failed to load admin management data.");
    } finally {
      setLoadingManagement(false);
    }
  }, [adminChecked, isAdmin]);

  const onUnlinkVendorUser = useCallback(
    async (userId: string, vendorIdToRemove: string) => {
      setError(null);
      setSuccess(null);

      const ok = window.confirm("Unlink this user from the vendor?");
      if (!ok) return;

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      const accessToken = session?.access_token ?? "";
      if (!accessToken) {
        setError("You must be logged in as an admin.");
        return;
      }

      const key = `${userId}:${vendorIdToRemove}`;
      setUnlinkingKey(key);
      try {
        const res = await fetch("/api/admin/unlink-vendor-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ userId, vendorId: vendorIdToRemove }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.error || "Failed to unlink.");
          return;
        }

        setSuccess("Unlinked successfully.");
        await refreshManagement();
      } catch (e) {
        console.error("Unlink error", e);
        setError("Unexpected error.");
      } finally {
        setUnlinkingKey(null);
      }
    },
    [refreshManagement],
  );

  const onRevokeAdmin = useCallback(
    async (userId: string) => {
      setError(null);
      setSuccess(null);

      const ok = window.confirm("Revoke admin role for this user?");
      if (!ok) return;

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      const accessToken = session?.access_token ?? "";
      if (!accessToken) {
        setError("You must be logged in as an admin.");
        return;
      }

      setRevokingUserId(userId);
      try {
        const res = await fetch("/api/admin/revoke-admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ userId }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.error || "Failed to revoke admin.");
          return;
        }

        setSuccess("Admin role revoked.");
        await refreshManagement();
      } catch (e) {
        console.error("Revoke admin error", e);
        setError("Unexpected error.");
      } finally {
        setRevokingUserId(null);
      }
    },
    [refreshManagement],
  );

  useEffect(() => {
    void refreshManagement();
  }, [refreshManagement]);

  const filteredVendors = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => {
      const name = (v.name ?? "").toLowerCase();
      return name.includes(q) || v.id.toLowerCase().includes(q);
    });
  }, [vendorSearch, vendors]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !vendorId.trim()) {
      setError("Email and vendor are required.");
      return;
    }

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    const accessToken = session?.access_token ?? "";
    if (!accessToken) {
      setError("You must be logged in as an admin.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/link-vendor-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email, vendorId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
        return;
      }

      setSuccess(
        data.alreadyLinked
          ? "User is already linked to this vendor."
          : "User successfully linked to vendor.",
      );
      await refreshManagement();
    } catch (err) {
      console.error("Admin link error", err);
      setError("Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const onGrantAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!grantEmail.trim()) {
      setError("Email is required.");
      return;
    }

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    const accessToken = session?.access_token ?? "";
    if (!accessToken) {
      setError("You must be logged in as an admin.");
      return;
    }

    setGrantLoading(true);
    try {
      const res = await fetch("/api/admin/grant-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email: grantEmail }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Request failed");
        return;
      }

      setSuccess(
        data?.alreadyAdmin
          ? "User is already an admin."
          : "Admin role granted successfully.",
      );
      await refreshManagement();
    } catch (err) {
      console.error("Grant admin error", err);
      setError("Unexpected error.");
    } finally {
      setGrantLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <Link
          href="/"
          className="text-xs font-medium text-sky-400 hover:text-sky-300"
        >
          ← Back to home
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Admin</h1>
        <p className="text-sm text-slate-300">
          Link a vendor user (Supabase auth email) to a vendor.
        </p>
      </header>

      {!adminChecked ? (
        <p className="text-sm text-slate-300">Checking admin access…</p>
      ) : !isAdmin ? (
        <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-sm text-amber-100">
          <p>You must be logged in with an admin account to access this page.</p>
          <Link
            href="/auth/vendor-login?next=/admin"
            className="text-sm font-medium text-sky-400 hover:text-sky-300"
          >
            Go to login
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-100">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-100">
              {success}
            </p>
          )}

          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4"
          >
            <div className="space-y-1 text-sm">
              <label
                className="block text-xs font-medium text-slate-300"
                htmlFor="email"
              >
                Vendor user email
              </label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-50 outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-2 text-sm">
              <label className="block text-xs font-medium text-slate-300">
                Vendor
              </label>

              <input
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search vendors by name"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-50 outline-none focus:border-sky-500"
              />

              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-50 outline-none focus:border-sky-500"
              >
                <option value="">
                  {loadingVendors ? "Loading vendors…" : "Select a vendor"}
                </option>
                {filteredVendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {(v.name ?? "Unnamed vendor").slice(0, 60)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {loading ? "Linking…" : "Link vendor user"}
            </button>
          </form>

          <form
            onSubmit={onGrantAdmin}
            className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4"
          >
            <h2 className="text-sm font-semibold text-slate-100">Admin roles</h2>
            <div className="space-y-1 text-sm">
              <label
                className="block text-xs font-medium text-slate-300"
                htmlFor="grantEmail"
              >
                Grant admin to email
              </label>
              <input
                id="grantEmail"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-50 outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={grantLoading}
              className="inline-flex w-full items-center justify-center rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-100 hover:border-sky-500 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {grantLoading ? "Granting…" : "Grant admin role"}
            </button>
          </form>

          <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-100">Vendor links</h2>
              <button
                type="button"
                onClick={() => void refreshManagement()}
                disabled={loadingManagement}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 disabled:opacity-60"
              >
                {loadingManagement ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {vendorUsers.length === 0 ? (
              <p className="text-xs text-slate-400">No vendor-user links found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-xs">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="px-2">User</th>
                      <th className="px-2">Vendor</th>
                      <th className="px-2">Linked</th>
                      <th className="px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorUsers.map((row) => {
                      const key = `${row.user_id}:${row.vendor_id}`;
                      return (
                        <tr key={key} className="rounded-lg bg-slate-950">
                          <td className="px-2 py-2 text-slate-100">
                            <div className="font-medium">
                              {row.email ?? "(unknown email)"}
                            </div>
                            <div className="text-[11px] text-slate-400">{row.user_id}</div>
                          </td>
                          <td className="px-2 py-2 text-slate-100">
                            <div className="font-medium">
                              {row.vendor_name ?? "(unnamed vendor)"}
                            </div>
                            <div className="text-[11px] text-slate-400">{row.vendor_id}</div>
                          </td>
                          <td className="px-2 py-2 text-slate-300">
                            {new Date(row.created_at).toLocaleString("en-TZ", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => void onUnlinkVendorUser(row.user_id, row.vendor_id)}
                              disabled={unlinkingKey === key}
                              className="rounded-md border border-slate-700 px-2 py-1 text-xs font-medium text-slate-100 hover:border-red-500 hover:text-red-200 disabled:opacity-60"
                            >
                              {unlinkingKey === key ? "Unlinking…" : "Unlink"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-100">Admins</h2>
              <span className="text-[11px] text-slate-400">{admins.length} total</span>
            </div>

            {admins.length === 0 ? (
              <p className="text-xs text-slate-400">No admins found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] border-separate border-spacing-y-2 text-left text-xs">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="px-2">Admin</th>
                      <th className="px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((row) => {
                      const isSelf = currentAdminUserId === row.user_id;
                      return (
                        <tr key={row.user_id} className="rounded-lg bg-slate-950">
                          <td className="px-2 py-2 text-slate-100">
                            <div className="font-medium">
                              {row.email ?? "(unknown email)"}
                              {isSelf ? " (you)" : ""}
                            </div>
                            <div className="text-[11px] text-slate-400">{row.user_id}</div>
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => void onRevokeAdmin(row.user_id)}
                              disabled={isSelf || revokingUserId === row.user_id}
                              className="rounded-md border border-slate-700 px-2 py-1 text-xs font-medium text-slate-100 hover:border-red-500 hover:text-red-200 disabled:opacity-60"
                            >
                              {isSelf
                                ? "Cannot revoke"
                                : revokingUserId === row.user_id
                                  ? "Revoking…"
                                  : "Revoke"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
