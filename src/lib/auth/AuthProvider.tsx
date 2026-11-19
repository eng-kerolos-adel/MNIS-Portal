"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  TAB_USER_KEY,
  clearTabSession,
  getAccessToken,
  getTabRefreshToken,
  refreshSession,
  request,
  setOnUnauthorized,
  setSessionTokens,
} from "@/lib/api/client";

export type Role = "DOCTOR" | "PHARMACIST" | "LAB_TECH" | "HOSPITAL_STAFF" | "EXECUTIVE" | "ADMIN" | "RECEPTIONIST" | "PATIENT";

export interface SessionUser {
  id: string;
  email: string | null;
  role: Role;
  fullNameEn: string;
  fullNameAr: string;
  licenseNo?: string | null;
  specialityEn?: string | null;
  specialityAr?: string | null;
  facilityEn?: string | null;
  facilityAr?: string | null;
  patientId: string | null;
  mustChangePassword: boolean;
}

type Ctx = {
  user: SessionUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clear = useCallback(() => { clearTabSession(); setUser(null); }, []);

  // Restore this tab's isolated session on reload (without touching other tabs' users).
  useEffect(() => {
    setOnUnauthorized(clear);
    let alive = true;
    (async () => {
      try {
        const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        if (params?.get("newSession") === "1" || params?.has("autoDemo")) {
          clearTabSession();
          if (alive) setUser(null);
          return;
        }

        const cachedRaw = typeof window !== "undefined" ? window.sessionStorage.getItem(TAB_USER_KEY) : null;
        if (cachedRaw && alive) {
          try {
            setUser(JSON.parse(cachedRaw) as SessionUser);
          } catch { /* ignore malformed cache */ }
        }

        const hasAt = Boolean(getAccessToken());
        const hasRt = Boolean(getTabRefreshToken());
        if (hasAt || (hasRt && (await refreshSession()))) {
          const me = await request<SessionUser>("/auth/me");
          if (alive) {
            setUser(me);
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem(TAB_USER_KEY, JSON.stringify(me));
            }
          }
        } else if (alive) {
          clearTabSession();
          setUser(null);
        }
      } catch {
        clearTabSession();
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; setOnUnauthorized(null); };
  }, [clear]);

  const login = useCallback(async (identifier: string, password: string) => {
    const r = await request<{ accessToken: string; refreshToken?: string; user: SessionUser }>("/auth/login", {
      method: "POST",
      body: { identifier, password },
    });
    setSessionTokens(r.accessToken, r.refreshToken ?? null);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(TAB_USER_KEY, JSON.stringify(r.user));
    }
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(async () => {
    const rt = getTabRefreshToken();
    try {
      await request("/auth/logout", { method: "POST", body: rt ? { refreshToken: rt } : {} });
    } catch { /* still clear locally */ }
    clear();
  }, [clear]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await request("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
    clear(); // the server signed every session out; the user logs in again with the new password
  }, [clear]);

  const value = useMemo(() => ({ user, loading, login, logout, changePassword }), [user, loading, login, logout, changePassword]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
