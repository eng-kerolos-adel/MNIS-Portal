"use client";

import { doc, onSnapshot, type Timestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./client";

export interface LiveQueueSnapshot {
  doctorId: string;
  facilityKey: string;
  currentTicketNo: string | null;
  waitingCount: number;
  emergencyWaitingCount: number;
  updatedAt: Date | null;
}

export interface LiveErSummary {
  facilityKey: string;
  availableBeds: number;
  occupiedBeds: number;
  erWaiting: number;
  erCritical: number;
  updatedAt: Date | null;
}

export interface UserSignal {
  uid: string;
  lastEventType: string;
  unreadCount: number;
  updatedAt: Date | null;
}

function toDate(value: unknown): Date | null {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate();
  }
  return null;
}

const noop = () => {};

/** Subscribe to zero-PII clinic queue counts (`live_queues/{doctorId}`). */
export function subscribeLiveQueue(
  doctorId: string,
  onData: (snap: LiveQueueSnapshot | null) => void,
): () => void {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  if (!db || !auth?.currentUser || !doctorId) return noop;

  return onSnapshot(
    doc(db, "live_queues", doctorId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      const d = snapshot.data();
      onData({
        doctorId: String(d.doctorId ?? doctorId),
        facilityKey: String(d.facilityKey ?? "national"),
        currentTicketNo: typeof d.currentTicketNo === "string" ? d.currentTicketNo : null,
        waitingCount: Number(d.waitingCount ?? 0),
        emergencyWaitingCount: Number(d.emergencyWaitingCount ?? 0),
        updatedAt: toDate(d.updatedAt),
      });
    },
    () => {
      onData(null);
    },
  );
}

/** Subscribe to zero-PII hospital ER & bed availability summary (`live_er/{facilityKey}`). */
export function subscribeLiveEr(
  facilityKey: string,
  onData: (snap: LiveErSummary | null) => void,
): () => void {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  if (!db || !auth?.currentUser || !facilityKey) return noop;

  return onSnapshot(
    doc(db, "live_er", facilityKey),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      const d = snapshot.data();
      onData({
        facilityKey: String(d.facilityKey ?? facilityKey),
        availableBeds: Number(d.availableBeds ?? 0),
        occupiedBeds: Number(d.occupiedBeds ?? 0),
        erWaiting: Number(d.erWaiting ?? 0),
        erCritical: Number(d.erCritical ?? 0),
        updatedAt: toDate(d.updatedAt),
      });
    },
    () => {
      onData(null);
    },
  );
}

/** Subscribe to user unread notification pulse (`user_signals/{userId}`). */
export function subscribeUserSignal(
  userId: string,
  onData: (snap: UserSignal | null) => void,
): () => void {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  if (!db || !auth?.currentUser || !userId) return noop;

  return onSnapshot(
    doc(db, "user_signals", userId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      const d = snapshot.data();
      onData({
        uid: String(d.uid ?? userId),
        lastEventType: String(d.lastEventType ?? ""),
        unreadCount: Number(d.unreadCount ?? 0),
        updatedAt: toDate(d.updatedAt),
      });
    },
    () => {
      onData(null);
    },
  );
}
