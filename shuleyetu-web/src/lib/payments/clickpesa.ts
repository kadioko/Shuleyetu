import { log, logError } from "@/lib/logger";

const CLICKPESA_BASE_URL = process.env.CLICKPESA_BASE_URL ?? "https://api.clickpesa.com";
const CLICKPESA_CLIENT_ID = process.env.CLICKPESA_CLIENT_ID;
const CLICKPESA_API_KEY = process.env.CLICKPESA_API_KEY;

export type ClickpesaPaymentStatus = "pending" | "paid" | "failed";

export function mapClickpesaStatus(status: string): ClickpesaPaymentStatus {
  const normalized = status.toUpperCase();
  if (normalized === "SUCCESS" || normalized === "SETTLED") return "paid";
  if (normalized === "FAILED") return "failed";
  return "pending";
}

export async function generateClickpesaToken(): Promise<string> {
  if (!CLICKPESA_CLIENT_ID || !CLICKPESA_API_KEY) {
    throw new Error("ClickPesa credentials are not configured");
  }

  const response = await fetch(`${CLICKPESA_BASE_URL}/third-parties/generate-token`, {
    method: "POST",
    headers: {
      "client-id": CLICKPESA_CLIENT_ID,
      "api-key": CLICKPESA_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to generate ClickPesa token (${response.status})`);
  }

  const data = (await response.json()) as { success?: boolean; token?: string };

  if (!data.token) {
    throw new Error("No token returned by ClickPesa");
  }

  return data.token;
}

export interface RetryOptions {
  attempts?: number;
  backoffMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry<T = unknown>(
  url: string,
  init: RequestInit,
  options: RetryOptions = {}
): Promise<{ response: Response; data: T }> {
  const attempts = options.attempts ?? 3;
  const backoffMs = options.backoffMs ?? 500;

  let lastError: Error | undefined;
  let lastResponse: Response | undefined;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      lastResponse = await fetch(url, init);

      const contentType = lastResponse.headers.get("content-type") ?? "";
      let data: T = {} as T;
      if (contentType.includes("application/json")) {
        data = (await lastResponse.json()) as T;
      } else if (lastResponse.status !== 204) {
        const text = await lastResponse.text();
        (data as Record<string, unknown>).raw = text;
      }

      // Retry on 5xx or transient network errors. 4xx errors are not retried.
      if (lastResponse.ok) {
        return { response: lastResponse, data };
      }

      if (lastResponse.status >= 500) {
        lastError = new Error(`ClickPesa returned ${lastResponse.status}`);
        log("warn", `ClickPesa request failed (attempt ${attempt}/${attempts})`, {
          url,
          status: lastResponse.status,
          attempt,
        });
        if (attempt < attempts) {
          await sleep(backoffMs * 2 ** (attempt - 1));
          continue;
        }
      }

      // Non-retryable 4xx — return immediately
      return { response: lastResponse, data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      log("warn", `ClickPesa request threw (attempt ${attempt}/${attempts})`, {
        url,
        error: lastError.message,
        attempt,
      });
      if (attempt < attempts) {
        await sleep(backoffMs * 2 ** (attempt - 1));
      }
    }
  }

  logError("ClickPesa request exhausted retries", lastError ?? new Error("Unknown"), { url, attempts });
  throw lastError ?? new Error("ClickPesa request failed after retries");
}

export function buildIdempotencyKey(orderId: string, orderReference: string): string {
  return `cp:${orderId}:${orderReference}:${Math.floor(Date.now() / 1_000_000)}`;
}
