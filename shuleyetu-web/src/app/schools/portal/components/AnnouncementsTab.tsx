"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  type SchoolAnnouncement,
} from "@/lib/schoolPortal";
import {
  Loading,
  EmptyMessage,
  Input,
  Select,
  Button,
  SubmitButton,
  Badge,
  ConfirmModal,
} from "./shared";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Everyone" },
  { value: "parents", label: "Parents" },
  { value: "staff", label: "Staff" },
  { value: "students", label: "Students" },
];

export function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [filterAudience, setFilterAudience] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SchoolAnnouncement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await getAnnouncements({
      audience: filterAudience || undefined,
    });
    setLoading(false);
    if (error) addToast({ type: "error", title: "Failed to load announcements", message: error });
    else setAnnouncements(data?.announcements ?? []);
  };

  useEffect(() => { void load(); }, [filterAudience]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await createAnnouncement({
      title: String(fd.get("title")).trim(),
      content: String(fd.get("content")).trim(),
      audience: String(fd.get("audience")) as SchoolAnnouncement["audience"],
      status: isDraft ? "draft" : "published",
      scheduled_at: scheduledAt || null,
    });
    setSubmitting(false);
    if (error) {
      addToast({ type: "error", title: "Failed to create announcement", message: error });
    } else {
      addToast({
        type: "success",
        title: isDraft ? "Draft saved" : "Announcement published",
      });
      setFormOpen(false);
      setIsDraft(false);
      setScheduledAt("");
      e.currentTarget.reset();
      void load();
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteAnnouncement(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) {
      addToast({ type: "error", title: "Delete failed", message: error });
    } else {
      addToast({ type: "success", title: "Announcement deleted" });
      void load();
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-50">Announcements</h2>
        <Button onClick={() => setFormOpen(!formOpen)}>
          {formOpen ? "Close" : "New announcement"}
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={filterAudience}
          onChange={(e) => setFilterAudience(e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-slate-50 outline-none focus:border-sky-500"
        >
          <option value="">All audiences</option>
          {AUDIENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {formOpen && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="font-semibold text-slate-200">New announcement</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="title" label="Title" required />
            <Select name="audience" label="Audience" options={AUDIENCE_OPTIONS} required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300" htmlFor="content">
              Content <span className="text-red-400">*</span>
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

          {/* Draft & scheduling */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/60 bg-slate-800/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3">
              <div
                onClick={() => setIsDraft(!isDraft)}
                className={`relative h-6 w-11 rounded-full transition-colors ${isDraft ? "bg-violet-500" : "bg-slate-700"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isDraft ? "translate-x-5" : ""}`}
                />
              </div>
              <span className="text-sm text-slate-300">Save as draft</span>
            </label>
            {!isDraft && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-400">
                  Schedule for later (optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <SubmitButton loading={submitting}>
              {isDraft ? "Save draft" : scheduledAt ? "Schedule" : "Publish now"}
            </SubmitButton>
            <Button variant="secondary" onClick={() => { setFormOpen(false); setIsDraft(false); setScheduledAt(""); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {announcements.length === 0 ? (
        <EmptyMessage message="No announcements yet. Create your first to inform parents, students, and staff." />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-100">{a.title}</p>
                    {(a as SchoolAnnouncement & { status?: string }).status === "draft" && (
                      <Badge variant="draft">Draft</Badge>
                    )}
                    {(a as SchoolAnnouncement & { scheduled_at?: string | null }).scheduled_at && (
                      <span className="text-xs text-violet-400">
                        Scheduled: {new Date((a as SchoolAnnouncement & { scheduled_at: string }).scheduled_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{a.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <Badge>{a.audience}</Badge>
                    <span>{new Date(a.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                </div>
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(a)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete announcement?"
        message={`"${deleteTarget?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
