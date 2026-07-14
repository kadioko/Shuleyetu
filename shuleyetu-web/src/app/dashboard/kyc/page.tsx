"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type DocumentRecord = {
  id: string;
  document_type: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const DOCUMENT_TYPES = [
  { value: "tin", label: "TIN Certificate" },
  { value: "business_license", label: "Business License" },
  { value: "nida", label: "NIDA ID" },
  { value: "other", label: "Other" },
];

export default function VendorKycPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [documentType, setDocumentType] = useState("tin");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push("/auth/vendor-login?next=/dashboard/kyc");
        return;
      }

      const { data: mapping, error: mapError } = await supabaseClient
        .from("vendor_users")
        .select("vendor_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (mapError || !mapping) {
        setError("You must be linked to a vendor to upload KYC documents.");
        setLoading(false);
        return;
      }

      setVendorId(mapping.vendor_id);

      const { data: docs } = await supabaseClient
        .from("vendor_documents")
        .select("id, document_type, status, created_at")
        .eq("vendor_id", mapping.vendor_id)
        .order("created_at", { ascending: false });

      setDocuments(docs ?? []);
      setLoading(false);
    };

    void load();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      const res = await fetch(`/api/vendors/${vendorId}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ documentType, fileUrl }),
      });

      const data = (await res.json()) as { error?: string; documentId?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to upload document");
        return;
      }

      setSuccess("Document uploaded and is pending review.");
      setFileUrl("");
      const { data: docs } = await supabaseClient
        .from("vendor_documents")
        .select("id, document_type, status, created_at")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });
      setDocuments(docs ?? []);
    } catch (err) {
      console.error("Upload error", err);
      setError("Unexpected error uploading document.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-slate-400">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Vendor KYC Documents</h1>
        <Link href="/dashboard" className="text-sm text-sky-400 hover:text-sky-300">
          ← Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-200">
          {success}
        </div>
      )}

      <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Upload New Document</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">File URL</label>
            <input
              type="url"
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://storage.shuleyetu.test/documents/..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Upload your file to Supabase storage or another secure location and paste the public URL here.
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting || !fileUrl.trim()}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-500 disabled:opacity-50"
          >
            {submitting ? "Uploading…" : "Upload Document"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Submitted Documents</h2>
        {documents.length === 0 ? (
          <p className="text-slate-500">No documents submitted yet.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {DOCUMENT_TYPES.find((t) => t.value === doc.document_type)?.label ?? doc.document_type}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    doc.status === "approved"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : doc.status === "rejected"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
