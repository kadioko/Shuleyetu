import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { applyRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthCheck {
  status: "ok" | "error" | "unknown";
  responseTime?: number;
  message?: string;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { error } = await supabaseServerClient.from("vendors").select("id").limit(1);
    if (error) throw error;
    return { status: "ok", responseTime: Date.now() - start };
  } catch (error) {
    return {
      status: "error",
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : "Database check failed",
    };
  }
}

async function checkAuth(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { error } = await supabaseServerClient.auth.getSession();
    if (error) throw error;
    return { status: "ok", responseTime: Date.now() - start };
  } catch (error) {
    return {
      status: "error",
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : "Auth check failed",
    };
  }
}

async function checkClickpesa(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const baseUrl = process.env.CLICKPESA_BASE_URL;
    if (!baseUrl) {
      return { status: "unknown", message: "ClickPesa not configured" };
    }
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { status: "ok", responseTime: Date.now() - start };
  } catch (error) {
    return {
      status: "error",
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : "ClickPesa health check failed",
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      return { status: "unknown", message: "Redis not configured (using memory fallback)" };
    }
    const response = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { status: "ok", responseTime: Date.now() - start };
  } catch (error) {
    return {
      status: "error",
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : "Redis check failed",
    };
  }
}

async function checkJobQueue(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { count, error } = await supabaseServerClient
      .from("background_jobs")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "running", "failed"]);
    if (error) throw error;
    return {
      status: "ok",
      responseTime: Date.now() - start,
      message: `${count ?? 0} pending/running/failed jobs`,
    };
  } catch (error) {
    return {
      status: "error",
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : "Job queue check failed",
    };
  }
}

export async function GET(request: NextRequest) {
  const { response: rateLimitResponse, headers } = await applyRateLimit(
    request,
    rateLimitConfigs.health
  );
  if (rateLimitResponse) return rateLimitResponse;

  const startTime = Date.now();

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey || !/^https?:\/\//i.test(supabaseUrl)) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Supabase environment variables are not configured correctly.",
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        checks: {
          database: { status: "error" },
          api: { status: "error" },
        },
      },
      { status: 503, headers }
    );
  }

  const [database, auth, clickpesa, redis, jobs] = await Promise.all([
    checkDatabase(),
    checkAuth(),
    checkClickpesa(),
    checkRedis(),
    checkJobQueue(),
  ]);

  const checks = {
    database: database.status,
    auth: auth.status,
    clickpesa: clickpesa.status,
    redis: redis.status,
    jobs: jobs.status,
  };

  const allHealthy = Object.values(checks).every((s) => s === "ok" || s === "unknown");
  const anyError = Object.values(checks).some((s) => s === "error");

  const responseTime = Date.now() - startTime;

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      version: process.env.APP_VERSION || "1.0.0",
      environment: process.env.NODE_ENV,
      checks,
      details: {
        database,
        auth,
        clickpesa,
        redis,
        jobs,
      },
      hasErrors: anyError,
    },
    { status: allHealthy ? 200 : 503, headers }
  );
}
