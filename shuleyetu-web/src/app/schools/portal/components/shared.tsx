"use client";

import React from "react";

// ---------- Error boundary ----------

type ErrorBoundaryProps = { children: React.ReactNode; fallback?: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean; message: string };

export class TabErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorMessage message={`Something went wrong: ${this.state.message}`} />
        )
      );
    }
    return this.props.children;
  }
}

// ---------- Layout helpers ----------

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ---------- Loading / empty / error states ----------

export function Loading() {
  return (
    <div className="flex min-h-[24rem] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500/30 border-t-sky-400" />
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-[16rem] items-center justify-center">
      <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center text-red-200">
        {message}
      </div>
    </div>
  );
}

export function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

// ---------- Form helpers ----------

export function Input({
  name,
  label,
  type = "text",
  placeholder,
  required,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300" htmlFor={name}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 placeholder-slate-500 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      />
    </div>
  );
}

export function Select({
  name,
  label,
  options,
  required,
  value,
  defaultValue,
  onChange,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[] | string[];
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  const normalised = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300" htmlFor={name}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none focus:border-sky-500"
      >
        {normalised.map((o) => (
          <option key={o.value} value={o.value} className="capitalize">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center gap-2 font-bold transition-all disabled:opacity-60";
  const sizes = {
    sm: "rounded-xl px-3 py-1.5 text-xs",
    md: "rounded-2xl px-5 py-2.5 text-sm",
  };
  const variants = {
    primary:
      "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/20 hover:scale-[1.02] hover:shadow-sky-500/30",
    secondary:
      "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
    danger:
      "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export function SubmitButton({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] disabled:opacity-60"
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {loading ? "Saving..." : children}
    </button>
  );
}

export function Badge({
  children,
  variant,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "active" | "inactive" | "pending" | "paid" | "partial" | "waived" | "draft";
  className?: string;
}) {
  const colors: Record<string, string> = {
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    inactive: "border-red-500/30 bg-red-500/10 text-red-300",
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    partial: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    waived: "border-slate-500/30 bg-slate-500/10 text-slate-400",
    draft: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  };
  const colorClass =
    variant && colors[variant]
      ? colors[variant]
      : "border-white/10 bg-white/5 text-slate-300";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${colorClass} ${className}`}
    >
      {children}
    </span>
  );
}

// ---------- Confirmation modal ----------

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-50">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- CSV export helper ----------

export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
