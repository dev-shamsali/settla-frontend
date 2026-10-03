import { API_BASE } from "@/config/env";

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number, public requestId?: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

/** Access token lives in memory only. Refresh token is an httpOnly cookie set by the backend. */
let accessToken: string | null = null;
let onAuthLost: (() => void) | null = null;
export const tokenStore = { get: () => accessToken, set: (t: string | null) => { accessToken = t; } };
export const setAuthLostHandler = (fn: () => void) => { onAuthLost = fn; };

const TIMEOUT_MS = 15000;
let refreshing: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST", credentials: "include", headers: { "content-type": "application/json", "x-requested-with": "settla" }, body: "{}",
      });
      if (!res.ok) return false;
      const j = await res.json();
      accessToken = j.data.accessToken;
      return true;
    } catch { return false; } finally { setTimeout(() => { refreshing = null; }, 0); }
  })();
  return refreshing;
}

interface Opts { method?: string; body?: unknown; idempotencyKey?: string; signal?: AbortSignal; query?: Record<string, string | number | boolean | undefined | null> }

export async function api<T>(path: string, opts: Opts = {}, _retried = false): Promise<T> {
  const method = opts.method ?? "GET";
  const qs = opts.query ? "?" + new URLSearchParams(Object.entries(opts.query).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => [k, String(v)])).toString() : "";
  const requestId = crypto.randomUUID();
  const attempts = method === "GET" ? 3 : 1;
  let lastErr: unknown;

  for (let i = 0; i < attempts; i += 1) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    opts.signal?.addEventListener("abort", () => ctrl.abort());
    try {
      const res = await fetch(`${API_BASE}${path}${qs === "?" ? "" : qs}`, {
        method, credentials: "include", signal: ctrl.signal,
        headers: {
          "content-type": "application/json", "x-request-id": requestId,
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
          ...(opts.idempotencyKey ? { "idempotency-key": opts.idempotencyKey } : {}),
        },
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      });
      clearTimeout(timer);
      if (res.status === 401 && !_retried && !path.startsWith("/auth/")) {
        if (await refreshSession()) return api<T>(path, opts, true);
        onAuthLost?.();
      }
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const e = json?.error;
        const err = new ApiError(e?.code ?? "HTTP_ERROR", e?.message ?? `Request failed (${res.status})`, res.status, e?.requestId ?? requestId, e?.details);
        if (res.status >= 500 && i < attempts - 1) { lastErr = err; await new Promise((r) => setTimeout(r, 300 * 2 ** i)); continue; }
        throw err;
      }
      return json.data as T;
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof ApiError) throw e;
      lastErr = e;
      if (opts.signal?.aborted) throw e;
      if (i < attempts - 1) { await new Promise((r) => setTimeout(r, 300 * 2 ** i)); continue; }
    }
  }
  if (lastErr instanceof ApiError) throw lastErr;
  throw new ApiError("NETWORK_ERROR", "Cannot reach the Settla API. Check your connection.", 0, requestId);
}
