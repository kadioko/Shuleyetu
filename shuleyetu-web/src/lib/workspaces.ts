import { supabaseClient } from "@/lib/supabaseClient";

export type WorkspaceSummary = {
  user: { id: string; email: string | null };
  vendors: { id: string; name: string }[];
  schools: { id: string; name: string; role: string }[];
  roles: string[];
  hasVendor: boolean;
  hasSchool: boolean;
  isAdmin: boolean;
};

let workspaceCache:
  | {
      accessToken: string;
      data: WorkspaceSummary;
      expiresAt: number;
    }
  | null = null;

export async function getWorkspaceSummary(): Promise<{
  data: WorkspaceSummary | null;
  error: string | null;
}> {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session?.access_token) {
    workspaceCache = null;
    return { data: null, error: "Not authenticated" };
  }

  if (
    workspaceCache &&
    workspaceCache.accessToken === session.access_token &&
    workspaceCache.expiresAt > Date.now()
  ) {
    return { data: workspaceCache.data, error: null };
  }

  const res = await fetch("/api/auth/workspaces", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const json = (await res.json().catch(() => ({}))) as
    | WorkspaceSummary
    | { error?: string };

  if (!res.ok) {
    return {
      data: null,
      error: "error" in json && json.error ? json.error : "Failed to load workspaces",
    };
  }

  const data = json as WorkspaceSummary;
  workspaceCache = {
    accessToken: session.access_token,
    data,
    expiresAt: Date.now() + 30_000,
  };
  return { data, error: null };
}

export function chooseWorkspacePath(
  summary: WorkspaceSummary,
  requestedNext?: string,
): string {
  const safeNext =
    requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : null;

  const accessCount =
    Number(summary.hasVendor) + Number(summary.hasSchool) + Number(summary.isAdmin);

  if (accessCount > 1) return "/workspaces";
  if (safeNext) return safeNext;
  if (summary.hasVendor) return "/dashboard";
  if (summary.hasSchool) return "/schools/portal";
  if (summary.isAdmin) return "/admin";
  return "/auth/login";
}
