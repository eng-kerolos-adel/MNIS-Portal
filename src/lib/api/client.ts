/**
 * Browser API client.
 * - Calls go to same-origin `/v1/*`, which next.config.mjs proxies to the backend, so the httpOnly
 *   refresh cookie is first-party (no third-party-cookie problems) and no CORS is involved.
 * - The access token lives in memory only (never localStorage); on reload it is restored via the cookie.
 */
let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAccessToken = (t: string | null) => { accessToken = t; };
export const setOnUnauthorized = (fn: (() => void) | null) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

const baseHeaders = { "Content-Type": "application/json", "X-Client-Type": "web" };

let refreshing: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    const r = await fetch("/v1/auth/refresh", { method: "POST", credentials: "include", headers: baseHeaders, body: "{}" });
    if (!r.ok) { accessToken = null; return false; }
    const d = (await r.json()) as { accessToken: string };
    accessToken = d.accessToken;
    return true;
  } catch {
    return false;
  }
}

/** Concurrent 401s share one refresh call (refresh tokens rotate, so parallel refreshes would kill the session). */
export function refreshSession(): Promise<boolean> {
  if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
  return refreshing;
}

export async function request<T>(path: string, opts: { method?: string; body?: unknown } = {}, retry = true): Promise<T> {
  const res = await fetch(`/v1${path}`, {
    method: opts.method ?? "GET",
    credentials: "include",
    headers: { ...baseHeaders, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && retry && !path.startsWith("/auth/login")) {
    if (await refreshSession()) return request<T>(path, opts, false);
    onUnauthorized?.();
  }
  if (!res.ok) {
    let code = "ERROR";
    try {
      const j = (await res.json()) as { message?: unknown };
      code = Array.isArray(j.message) ? j.message.join(", ") : String(j.message ?? code);
    } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
