/**
 * Browser API client with strict per-tab session isolation.
 * - Each browser tab stores its own accessToken & refreshToken in window.sessionStorage,
 *   which the browser isolates per tab and wipes when the tab closes.
 * - Multiple different staff accounts can operate concurrently across separate tabs in
 *   the same browser without overwriting cookies or triggering false token-reuse lockouts.
 */
const TAB_AT_KEY = "mnis_tab_at";
const TAB_RT_KEY = "mnis_tab_rt";
export const TAB_USER_KEY = "mnis_tab_user";

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    const stored = window.sessionStorage.getItem(TAB_AT_KEY);
    if (stored) {
      accessToken = stored;
      return stored;
    }
  }
  return null;
}

export function getTabRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TAB_RT_KEY);
}

export function setSessionTokens(access: string | null, refresh?: string | null) {
  accessToken = access;
  if (typeof window === "undefined") return;
  if (access) window.sessionStorage.setItem(TAB_AT_KEY, access);
  else window.sessionStorage.removeItem(TAB_AT_KEY);

  if (refresh !== undefined) {
    if (refresh) window.sessionStorage.setItem(TAB_RT_KEY, refresh);
    else window.sessionStorage.removeItem(TAB_RT_KEY);
  }
}

export function clearTabSession() {
  accessToken = null;
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TAB_AT_KEY);
  window.sessionStorage.removeItem(TAB_RT_KEY);
  window.sessionStorage.removeItem(TAB_USER_KEY);
}

export const setAccessToken = (t: string | null) => {
  if (t === null) {
    clearTabSession();
    return;
  }
  setSessionTokens(t);
};

export const setOnUnauthorized = (fn: (() => void) | null) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

const baseHeaders = { "Content-Type": "application/json", "X-Client-Type": "web" };

let refreshing: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const rt = getTabRefreshToken();
  if (!rt) {
    accessToken = null;
    return false;
  }
  try {
    const r = await fetch("/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: baseHeaders,
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!r.ok) {
      clearTabSession();
      return false;
    }
    const d = (await r.json()) as { accessToken: string; refreshToken?: string };
    setSessionTokens(d.accessToken, d.refreshToken ?? rt);
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
  const token = getAccessToken();
  const res = await fetch(`/v1${path}`, {
    method: opts.method ?? "GET",
    credentials: "include",
    headers: { ...baseHeaders, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
