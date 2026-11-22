"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import {
  appCheckDebugToken,
  firebaseConfig,
  isFirebaseConfigured,
  recaptchaEnterpriseSiteKey,
  useFirebaseEmulators,
} from "./config";

let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;
let appCheckInstance: AppCheck | null = null;
let appCheckAttempted = false;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined" || !isFirebaseConfigured) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function initFirebaseAppCheck(app?: FirebaseApp | null): AppCheck | null {
  if (typeof window === "undefined" || appCheckAttempted) return appCheckInstance;
  const targetApp = app ?? getFirebaseApp();
  if (!targetApp) return null;
  appCheckAttempted = true;

  if (!recaptchaEnterpriseSiteKey) return null;

  try {
    if (process.env.NODE_ENV !== "production") {
      const globalScope = self as unknown as Record<string, unknown>;
      globalScope.FIREBASE_APPCHECK_DEBUG_TOKEN = appCheckDebugToken || true;
    }
    appCheckInstance = initializeAppCheck(targetApp, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    appCheckInstance = null;
  }
  return appCheckInstance;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  const auth = getAuth(app);
  if (useFirebaseEmulators && !authEmulatorConnected) {
    authEmulatorConnected = true;
    try {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    } catch {
      /* ignore if already connected */
    }
  }
  return auth;
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  const db = getFirestore(app);
  if (useFirebaseEmulators && !firestoreEmulatorConnected) {
    firestoreEmulatorConnected = true;
    try {
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
    } catch {
      /* ignore if already connected */
    }
  }
  return db;
}
