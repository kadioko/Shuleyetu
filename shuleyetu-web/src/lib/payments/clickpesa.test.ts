import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  log: vi.fn(),
  logError: vi.fn(),
}));

import { mapClickpesaStatus, buildIdempotencyKey } from "./clickpesa";

describe("clickpesa payment helpers", () => {
  it("maps ClickPesa statuses to internal payment status", () => {
    expect(mapClickpesaStatus("SUCCESS")).toBe("paid");
    expect(mapClickpesaStatus("SETTLED")).toBe("paid");
    expect(mapClickpesaStatus("Failed")).toBe("failed");
    expect(mapClickpesaStatus("PENDING")).toBe("pending");
    expect(mapClickpesaStatus("unknown")).toBe("pending");
  });

  it("builds deterministic idempotency keys for the same million-second window", () => {
    const orderId = "550e8400-e29b-41d4-a716-446655440000";
    const ref = "ORDER-123";
    const key1 = buildIdempotencyKey(orderId, ref);
    const key2 = buildIdempotencyKey(orderId, ref);
    expect(key1).toBe(key2);
    expect(key1.startsWith("cp:")).toBe(true);
  });
});
