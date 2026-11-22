"use client";

import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { getFirebaseApp } from "./client";

let analyticsPromise: ReturnType<typeof getAnalytics> | null = null;

async function resolveAnalytics() {
  if (typeof window === "undefined") return null;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    if (!analyticsPromise) {
      analyticsPromise = getAnalytics(app);
    }
    return analyticsPromise;
  } catch {
    return null;
  }
}

/** Logs strictly non-PII UI feature usage events to Firebase Analytics. */
export async function logPortalFeatureEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    const analytics = await resolveAnalytics();
    if (!analytics) return;
    logEvent(analytics, eventName, params);
  } catch {
    /* analytics never interrupts clinical workflows */
  }
}
