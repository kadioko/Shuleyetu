"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  type SchoolClass,
} from "@/lib/schoolPortal";
import {
  Loading,
  EmptyMessage,
  Input,
  Button,
  SubmitButton,
  Badge,
  ConfirmModal,
} from "./shared";

export function ClassesTab() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<SchoolClass | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await getClasses();
    setLoading(false);
    if (error) addToast({ type: "error", title: "Failed to load classes", message: error });
    else setClasses(data?.classes ?? []);
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name") ?? "").trim(),
      grade: String(fd.get("grade") ?? "").trim() || null,
      stream: String(fd.get("stream") ?? "").trim() || null,
      room: String(fd.get("room") ?? "").trim() || null,
      capacity: Number(fd.get("capacity")) || null,
    };

    const { error } = editTarget
      ? await updateClass(editTarget.id, body)
      : await createClass(body);

    setSubmitting(false);
    if (error) {
      addToast({ type: "error", title: editTarget ? "Update failed" : "Create failed", message: error });
    } else {
      addToast({ type: "success", title: editTarget ? "Class updated" : "Class created" });
      setFormOpen(false);
      setEditTarget(null);
      e.currentTarget.reset();
      void load();
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteClass(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) {
      addToast({ type: "error", title: "Delete failed", message: error });
    } else {
      addToast({ type: "success", title: "Class deleted" });
      void load();
    }
  };

  const openEdit = (cls: SchoolClass) => {
    setEditTarget(cls);
    setFormOpen(true);
  };

  const openAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-50">Classes</h2>
        <Button onClick={formOpen && !editTarget ? () => setFormOpen(false) : openAdd}>
          {formOpen && !editTarget ? "Close" : "Add class"}
        </Button>
      </div>

      {formOpen && (
        <form
          key={editTarget?.id ?? "new"}
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-6"
        >
          <h3 className="font-semibold text-slate-200">
            {editTarget ? `Edit: ${editTarget.name}` : "New class"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="name" label="Class name" placeholder="e.g. Standard 7A" required defaultValue={editTarget?.name} />
            <Input name="grade" label="Grade" placeholder="e.g. Standard 7" defaultValue={editTarget?.grade ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input name="stream" label="Stream" placeholder="e.g. A" defaultValue={editTarget?.stream ?? ""} />
            <Input name="room" label="Room" placeholder="e.g. Room 4" defaultValue={editTarget?.room ?? ""} />
            <Input name="capacity" type="number" label="Capacity" placeholder="40" defaultValue={editTarget?.capacity?.toString() ?? ""} />
          </div>
          <div className="flex gap-3">
            <SubmitButton loading={submitting}>{editTarget ? "Update class" : "Save class"}</SubmitButton>
            <Button
              variant="secondary"
              onClick={() => { setFormOpen(false); setEditTarget(null); }}
            >
              Cancel
            </Button>
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
                <th className="px-6 py-4 text-right">Actions</th>
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
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(c)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete class?"
        message={`"${deleteTarget?.name}" will be permanently removed. Students in this class will need to be reassigned.`}
        confirmLabel="Delete class"
        loading={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
