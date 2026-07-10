"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  getSchoolSettings,
  updateSchoolSettings,
  getSchoolUsers,
  getSchoolAuditLogs,
  inviteSchoolUser,
  updateSchoolUserRole,
  removeSchoolUser,
  type School,
  type SchoolUser,
  type SchoolAuditLog,
} from "@/lib/schoolPortal";
import { useSchool } from "../SchoolContext";
import { Loading, ErrorMessage, EmptyMessage, Button, SubmitButton, Badge } from "./shared";

export function SettingsTab() {
  const { school: contextSchool, role, refresh } = useSchool();
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
    const fd = new FormData(e.currentTarget);
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
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!school) return <EmptyMessage message="No school found" />;

  const field = (id: string, label: string, opts?: { type?: string; textarea?: boolean; required?: boolean; defaultValue?: string }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300" htmlFor={id}>
        {label}
        {opts?.required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {opts?.textarea ? (
        <textarea
          id={id}
          name={id}
          rows={3}
          defaultValue={opts.defaultValue ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      ) : (
        <input
          id={id}
          name={id}
          type={opts?.type ?? "text"}
          required={opts?.required}
          defaultValue={opts?.defaultValue ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-50 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-50">School settings</h2>

      <form
        key={school.updated_at}
        onSubmit={onSubmit}
        className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 md:p-8"
      >
        {field("name", "School name", { required: true, defaultValue: school.name })}
        <div className="grid gap-5 sm:grid-cols-2">
          {field("region", "Region", { defaultValue: school.region ?? "" })}
          {field("district", "District", { defaultValue: school.district ?? "" })}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {field("ward", "Ward", { defaultValue: school.ward ?? "" })}
          {field("phone", "Phone", { defaultValue: school.phone ?? "" })}
        </div>
        {field("email", "School email", { type: "email", defaultValue: school.email ?? "" })}
        {field("address", "Address", { textarea: true, defaultValue: school.address ?? "" })}
        {error && <p className="text-sm text-red-300">{error}</p>}
        <SubmitButton loading={saving}>Save settings</SubmitButton>
      </form>

      {role === "admin" && (
        <>
          <SchoolUsersPanel />
          <SchoolAuditPanel />
        </>
      )}
    </div>
  );
}

function SchoolUsersPanel() {
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SchoolUser["role"]>("staff");
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getSchoolUsers();
    setLoading(false);
    if (error) setError(error);
    else setUsers(data?.users ?? []);
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error } = await inviteSchoolUser({ email, role });
    setSubmitting(false);
    if (error) {
      setError(error);
      addToast({ type: "error", title: "Link failed", message: error });
      return;
    }
    setEmail("");
    setRole("staff");
    addToast({
      type: "success",
      title: data?.invite ? "Invite created" : "User linked",
      message: data?.invite
        ? "No account exists yet — a pending invite was created."
        : "The account can now access this school portal.",
    });
    void load();
  };

  const onRoleChange = async (userId: string, nextRole: SchoolUser["role"]) => {
    const { error } = await updateSchoolUserRole({ userId, role: nextRole });
    if (error) { addToast({ type: "error", title: "Role update failed", message: error }); return; }
    addToast({ type: "success", title: "Role updated" });
    void load();
  };

  const onRemove = async (userId: string) => {
    const { error } = await removeSchoolUser(userId);
    if (error) { addToast({ type: "error", title: "Remove failed", message: error }); return; }
    addToast({ type: "success", title: "Access removed" });
    void load();
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 md:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-50">School user access</h2>
          <p className="mt-1 text-sm text-slate-400">
            Link existing Shuleyetu accounts and control their portal role.
          </p>
        </div>
        <Badge>Admin only</Badge>
      </div>

      <form onSubmit={onInvite} className="mt-6 grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300" htmlFor="invite-email">Account email</label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@example.com"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300" htmlFor="invite-role">Role</label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as SchoolUser["role"])}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none focus:border-sky-500"
          >
            <option value="staff">Staff</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Linking..." : "Link user"}
        </Button>
      </form>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <div className="mt-6 overflow-x-auto">
        {loading ? (
          <Loading />
        ) : users.length === 0 ? (
          <EmptyMessage message="No school users linked yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-slate-400">
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">Added</th>
                <th className="pb-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 text-slate-200">{user.email ?? user.user_id}</td>
                  <td className="py-3">
                    <select
                      value={user.role}
                      onChange={(e) => void onRoleChange(user.user_id, e.target.value as SchoolUser["role"])}
                      className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-50 outline-none focus:border-sky-500"
                    >
                      <option value="staff">Staff</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 text-slate-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => void onRemove(user.user_id)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function SchoolAuditPanel() {
  const [logs, setLogs] = useState<SchoolAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchoolAuditLogs().then(({ data }) => {
      setLogs(data?.logs ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 md:p-8">
      <h2 className="text-xl font-bold text-slate-50">Recent school activity</h2>
      <p className="mt-1 text-sm text-slate-400">Audit trail for important portal changes.</p>
      <div className="mt-6">
        {loading ? (
          <Loading />
        ) : logs.length === 0 ? (
          <EmptyMessage message="No audit events yet." />
        ) : (
          <ul className="divide-y divide-white/10">
            {logs.map((log) => (
              <li key={log.id} className="py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-slate-100 capitalize">
                    {log.action.replace(/_/g, " ")} {log.entity_type}
                  </p>
                  <span className="text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Actor: {log.actor_user_id ?? "System"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
