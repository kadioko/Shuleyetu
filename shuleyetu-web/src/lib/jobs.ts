import { supabaseServerClient } from "./supabaseServer";
import { logError } from "./logger";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type JobPriority = "low" | "normal" | "high";

export interface JobPayload {
  type: string;
  payload: Record<string, unknown>;
}

export interface EnqueueOptions {
  runAt?: Date;
  priority?: JobPriority;
  maxAttempts?: number;
}

export async function enqueueJob(
  type: string,
  payload: Record<string, unknown>,
  options: EnqueueOptions = {}
): Promise<{ id: string } | null> {
  try {
    const { data, error } = await supabaseServerClient
      .from("background_jobs")
      .insert({
        type,
        payload,
        status: "pending",
        priority: options.priority ?? "normal",
        run_at: options.runAt?.toISOString() ?? new Date().toISOString(),
        attempts: 0,
        max_attempts: options.maxAttempts ?? 3,
      })
      .select("id")
      .single();

    if (error || !data) {
      logError("Failed to enqueue background job", error ?? new Error("No data returned"), {
        type,
        payload,
      });
      return null;
    }

    return { id: data.id };
  } catch (error) {
    logError("Unexpected error enqueueing job", error, { type, payload });
    return null;
  }
}

export async function claimPendingJob(
  workerId: string,
  types?: string[]
): Promise<{ id: string; type: string; payload: Record<string, unknown>; attempts: number } | null> {
  try {
    const now = new Date().toISOString();

    // Atomic claim: pick one pending/runnable job, set status to running and worker_id
    const { data, error } = await supabaseServerClient.rpc("claim_background_job", {
      p_types: types ?? null,
      p_worker_id: workerId,
      p_now: now,
    });

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      if (error) logError("Failed to claim job", error, { workerId, types });
      return null;
    }

    const job = data[0] as {
      id: string;
      type: string;
      payload: Record<string, unknown>;
      attempts: number;
    };

    return job;
  } catch (error) {
    logError("Unexpected error claiming job", error, { workerId, types });
    return null;
  }
}

export async function completeJob(jobId: string): Promise<void> {
  try {
    const { error } = await supabaseServerClient
      .from("background_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        worker_id: null,
      })
      .eq("id", jobId);

    if (error) {
      logError("Failed to mark job completed", error, { jobId });
    }
  } catch (error) {
    logError("Unexpected error completing job", error, { jobId });
  }
}

export async function failJob(jobId: string, errorMessage: string): Promise<void> {
  try {
    const { data: job } = await supabaseServerClient
      .from("background_jobs")
      .select("attempts, max_attempts")
      .eq("id", jobId)
      .single();

    const attempts = (job?.attempts ?? 0) + 1;
    const maxAttempts = job?.max_attempts ?? 3;
    const status: JobStatus = attempts >= maxAttempts ? "failed" : "pending";

    const { error } = await supabaseServerClient
      .from("background_jobs")
      .update({
        status,
        attempts,
        last_error: errorMessage,
        run_at: status === "pending" ? new Date(Date.now() + 60_000 * attempts).toISOString() : null,
        worker_id: null,
      })
      .eq("id", jobId);

    if (error) {
      logError("Failed to mark job failed", error, { jobId, errorMessage });
    }
  } catch (error) {
    logError("Unexpected error failing job", error, { jobId, errorMessage });
  }
}

export async function cancelJob(jobId: string): Promise<void> {
  try {
    const { error } = await supabaseServerClient
      .from("background_jobs")
      .update({ status: "cancelled", worker_id: null })
      .eq("id", jobId)
      .in("status", ["pending", "running"]);

    if (error) {
      logError("Failed to cancel job", error, { jobId });
    }
  } catch (error) {
    logError("Unexpected error cancelling job", error, { jobId });
  }
}
