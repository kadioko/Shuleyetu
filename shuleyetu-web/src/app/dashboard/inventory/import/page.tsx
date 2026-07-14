"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { supabaseClient } from "@/lib/supabaseClient";

const CATEGORIES = ["textbook", "uniform", "stationery", "other"];
const TEMPLATE_HEADERS = "name,category,price_tzs,stock_quantity,image_url\n" +
  "Primary Mathematics Book,textbook,15000,50,\n" +
  "School Uniform Set,uniform,45000,30,\n" +
  "A4 Exercise Book Pack,stationery,12000,100,\n";

type ParsedRow = {
  name: string;
  category: string;
  price_tzs: number;
  stock_quantity: number;
  image_url: string;
};

type RowValidation = {
  valid: boolean;
  errors: string[];
};

export default function InventoryImportPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [rows, setRows] = useState<(ParsedRow & RowValidation)[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVendor = async () => {
      setLoadingUser(true);
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push("/auth/vendor-login?next=/dashboard/inventory/import");
        return;
      }
      const { data: mapping, error: mapError } = await supabaseClient
        .from("vendor_users")
        .select("vendor_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (mapError || !mapping) {
        setError("No vendor is linked to this account. Contact an admin.");
        setLoadingUser(false);
        return;
      }
      setVendorId(mapping.vendor_id);
      setLoadingUser(false);
    };
    void loadVendor();
  }, [router]);

  const handleFile = (file: File) => {
    setParsing(true);
    setMessage(null);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = (results.data as Record<string, string>[]).map((row) => {
          const name = String(row.name ?? "").trim();
          const category = String(row.category ?? "").trim().toLowerCase();
          const price = Number(row.price_tzs ?? "0");
          const stock = Number(row.stock_quantity ?? "0");
          const image_url = String(row.image_url ?? "").trim();

          const errors: string[] = [];
          if (!name) errors.push("Name is required");
          if (!CATEGORIES.includes(category)) errors.push(`Category must be one of: ${CATEGORIES.join(", ")}`);
          if (Number.isNaN(price) || price <= 0) errors.push("Price must be a positive number");
          if (Number.isNaN(stock) || stock < 0) errors.push("Stock must be a non-negative number");

          return {
            name,
            category,
            price_tzs: Number.isNaN(price) ? 0 : price,
            stock_quantity: Number.isNaN(stock) ? 0 : stock,
            image_url,
            valid: errors.length === 0,
            errors,
          };
        });
        setRows(parsed);
        setParsing(false);
        if (parsed.length === 0) {
          setError("No rows found in the CSV. Ensure the file has a header row.");
        } else {
          const validCount = parsed.filter((r) => r.valid).length;
          setMessage(`${parsed.length} rows parsed. ${validCount} ready to import.`);
        }
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
        setParsing(false);
      },
    });
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_HEADERS], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!vendorId) return;
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      setError("No valid rows to import.");
      return;
    }

    setImporting(true);
    setError(null);
    setMessage(null);

    const payload = validRows.map((row) => ({
      vendor_id: vendorId,
      name: row.name,
      category: row.category,
      price_tzs: row.price_tzs,
      stock_quantity: row.stock_quantity,
      image_url: row.image_url || null,
      is_active: true,
    }));

    const { error: insertError } = await supabaseClient.from("inventory").insert(payload);

    if (insertError) {
      setError(`Import failed: ${insertError.message}`);
      setImporting(false);
      return;
    }

    setMessage(`Successfully imported ${validRows.length} items.`);
    setRows([]);
    setImporting(false);
    setTimeout(() => {
      router.push("/dashboard/inventory");
    }, 1500);
  };

  if (loadingUser) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </main>
    );
  }

  if (error && !vendorId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center max-w-md">
          <p className="font-bold text-red-200">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sky-400 hover:text-sky-300">Back to dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
          <nav className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <Link href="/dashboard" className="hover:text-sky-400 transition-colors">Dashboard</Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <Link href="/dashboard/inventory" className="hover:text-sky-400 transition-colors">Inventory</Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-200">Import CSV</span>
          </nav>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl">Import Inventory</h1>
          <p className="mt-2 text-base text-slate-400">Upload a CSV file to add many items at once.</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl w-full px-4 py-8 md:px-6">
        <section className="surface-panel rounded-3xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">CSV Template</h2>
              <p className="text-sm text-slate-400">Required columns: name, category, price_tzs, stock_quantity, image_url</p>
              <p className="text-sm text-slate-500">Categories: textbook, uniform, stationery, other</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-600 bg-slate-900/50 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-sky-500/50 hover:text-white"
            >
              Download Template
            </button>
          </div>
        </section>

        <section className="mt-6 surface-panel rounded-3xl p-6">
          <label className="block text-sm font-medium text-slate-300">Upload CSV</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="mt-3 block w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-sky-400"
          />

          {parsing && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              Parsing file…
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </section>

        {rows.length > 0 && (
          <section className="mt-6 surface-panel rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-200">Preview</h2>
              <p className="text-sm text-slate-400">
                {rows.filter((r) => r.valid).length} valid / {rows.length} total
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-700 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Price (TZS)</th>
                    <th className="pb-3 pr-4">Stock</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="border-b border-slate-800/50 last:border-0">
                      <td className="py-3 pr-4">{row.name}</td>
                      <td className="py-3 pr-4 capitalize">{row.category}</td>
                      <td className="py-3 pr-4">{row.price_tzs.toLocaleString("en-TZ")}</td>
                      <td className="py-3 pr-4">{row.stock_quantity}</td>
                      <td className="py-3">
                        {row.valid ? (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">Ready</span>
                        ) : (
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400" title={row.errors.join(", ")}>
                            {row.errors.length} error{row.errors.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleImport}
                disabled={importing || rows.filter((r) => r.valid).length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Importing…
                  </>
                ) : (
                  <>Import {rows.filter((r) => r.valid).length} items</>
                )}
              </button>
              <button
                onClick={() => {
                  setRows([]);
                  setMessage(null);
                  setError(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-600 bg-slate-900/50 px-6 py-3 text-sm font-bold text-slate-200 transition-all hover:border-red-500/50 hover:text-red-400"
              >
                Clear
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
