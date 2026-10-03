import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ApiError, tokenStore } from "@/services/apiClient";

const ok = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
const fail = (status: number, code: string) => new Response(JSON.stringify({ success: false, error: { code, message: code, requestId: "r1" } }), { status });

beforeEach(() => { tokenStore.set(null); vi.restoreAllMocks(); });

describe("api client", () => {
  it("unwraps the success envelope and sends bearer + request id", async () => {
    tokenStore.set("tok");
    const f = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ a: 1 }));
    expect(await api("/x")).toEqual({ a: 1 });
    const h = (f.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(h.authorization).toBe("Bearer tok");
    expect(h["x-request-id"]).toBeTruthy();
  });
  it("throws a typed ApiError with code and requestId", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(fail(403, "PERMISSION_DENIED"));
    await expect(api("/x")).rejects.toMatchObject({ code: "PERMISSION_DENIED", status: 403, requestId: "r1" });
  });
  it("never retries non-GET (no duplicate financial actions)", async () => {
    const f = vi.spyOn(globalThis, "fetch").mockResolvedValue(fail(500, "INTERNAL_ERROR"));
    await expect(api("/payments/p/refund", { method: "POST", body: {}, idempotencyKey: "k-123456789" })).rejects.toBeInstanceOf(ApiError);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("sends the idempotency key header", async () => {
    const f = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({}));
    await api("/p", { method: "POST", body: {}, idempotencyKey: "abc-12345678" });
    expect(((f.mock.calls[0][1] as RequestInit).headers as Record<string, string>)["idempotency-key"]).toBe("abc-12345678");
  });
  it("maps network failure to NETWORK_ERROR", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    await expect(api("/x", { method: "POST" })).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});
