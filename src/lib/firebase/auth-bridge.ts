"use client";

import { signInWithCustomToken, signOut } from "firebase/auth";
import { request } from "@/lib/api/client";
import { getFirebaseApp, getFirebaseAuth, initFirebaseAppCheck } from "./client";
import { isFirebaseConfigured } from "./config";

let syncingPromise: Promise<boolean> | null = null;

/**
 * Exchanges an active MNIS staff JWT session for a Firebase Custom Auth Token
 * containing server-signed RBAC claims (`role`, `facilityKey`, `patientId`).
 * Best-effort: never interrupts core clinical workflows if Firebase is offline.
 */
export async function syncFirebaseAuthSession(): Promise<boolean> {
  if (typeof window === "undefined" || !isFirebaseConfigured) return false;
  if (syncingPromise) return syncingPromise;

  syncingPromise = (async () => {
    try {
      const app = getFirebaseApp();
      const auth = getFirebaseAuth();
      if (!app || !auth) return false;
      initFirebaseAppCheck(app);

      const { token } = await request<{ token: string }>("/auth/firebase-token", {
        method: "POST",
      });
      await signInWithCustomToken(auth, token);
      return true;
    } catch {
      return false;
    } finally {
      syncingPromise = null;
    }
  })();

  return syncingPromise;
}

export async function signOutFirebaseSession(): Promise<void> {
  if (typeof window === "undefined" || !isFirebaseConfigured) return;
  try {
    const auth = getFirebaseAuth();
    if (auth?.currentUser) {
      await signOut(auth);
    }
  } catch {
    /* best-effort cleanup */
  }
}
