import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// In-memory fallback store for development / when Redis is not configured
const memoryStore = new Map<string, { count: number; resetTime: number }>();

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetTime < now) {
      memoryStore.delete(key);
    }
  }
}

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  cleanupExpiredEntries();

  const fullKey = `${config.keyPrefix}:${key}`;
  const now = Date.now();
  const entry = memoryStore.get(fullKey);

  if (!entry || entry.resetTime < now) {
    memoryStore.set(fullKey, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  const current = entry.count + 1;
  entry.count = current;

  const remaining = Math.max(0, config.maxRequests - current);
  const allowed = current <= config.maxRequests;

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000),
  };
}

async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return checkRateLimitMemory(key, config);
  }

  const fullKey = `${config.keyPrefix}:${key}`;
  const now = Date.now();
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  const pipeline = redis.pipeline();
  pipeline.incr(fullKey);
  pipeline.expire(fullKey, windowSeconds);
  const [count] = await pipeline.exec<[number]>();

  const remaining = Math.max(0, config.maxRequests - count);
  const allowed = count <= config.maxRequests;
  const resetTime = now + config.windowMs;

  return {
    allowed,
    remaining,
    resetTime,
    retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000),
  };
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    return await checkRateLimitRedis(key, config);
  } catch (error) {
    // Fail open if Redis is unreachable
    console.error("Rate limit check failed:", error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    };
  }
}

export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  key?: string
): Promise<NextResponse | null> {
  const { response } = await applyRateLimit(request, config, key);
  return response;
}

export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  key?: string
): Promise<{ response: NextResponse | null; headers: Headers }> {
  const identifier =
    key ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const result = await checkRateLimit(identifier, config);

  const headers = new Headers();
  headers.set("X-RateLimit-Limit", config.maxRequests.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000).toString());

  if (!result.allowed) {
    if (result.retryAfter) {
      headers.set("Retry-After", result.retryAfter.toString());
    }
    return {
      response: NextResponse.json(
        {
          error: "Too many requests",
          retryAfter: result.retryAfter,
        },
        { status: 429, headers }
      ),
      headers,
    };
  }

  return { response: null, headers };
}

export const rateLimitConfigs = {
  general: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    keyPrefix: "rl:general",
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    keyPrefix: "rl:auth",
  },
  payment: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    keyPrefix: "rl:payment",
  },
  webhook: {
    windowMs: 60 * 1000,
    maxRequests: 1000,
    keyPrefix: "rl:webhook",
  },
  health: {
    windowMs: 60 * 1000,
    maxRequests: 1000,
    keyPrefix: "rl:health",
  },
  admin: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 200,
    keyPrefix: "rl:admin",
  },
};

export type RateLimitConfigKey = keyof typeof rateLimitConfigs;
