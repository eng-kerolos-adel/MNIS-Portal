"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { request, refreshSession, setAccessToken, setOnUnauthorized } from "@/lib/api/client";

export type Role = "DOCTOR" | "PHARMACIST" | "LAB_TECH" | "HOSPITAL_STAFF" | "EXECUTIVE" | "ADMIN" | "RECEPTIONIST" | "PATIENT";

export interface SessionUser {
  id: string;
  email: string | null;
  role: Role;
  fullNameEn: string;
  fullNameAr: string;
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

  const clear = useCallback(() => { setAccessToken(null); setUser(null); }, []);

  // Restore the session after a page reload using the httpOnly refresh cookie.
  useEffect(() => {
    setOnUnauthorized(clear);
    let alive = true;
    (async () => {
      try {
        if (await refreshSession()) {
          const me = await request<SessionUser>("/auth/me");
          if (alive) setUser(me);
        }
      } catch { /* not signed in */ }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; setOnUnauthorized(null); };
  }, [clear]);

  const login = useCallback(async (identifier: string, password: string) => {
    const r = await request<{ accessToken: string; user: SessionUser }>("/auth/login", { method: "POST", body: { identifier, password } });
    setAccessToken(r.accessToken);
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(async () => {
    try { await request("/auth/logout", { method: "POST", body: {} }); } catch { /* still clear locally */ }
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
