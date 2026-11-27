"use client";

export type BrowserNotifPermission = "granted" | "denied" | "default" | "unsupported";

export function getBrowserNotifPermission(): BrowserNotifPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return window.Notification.permission;
}

export async function requestBrowserNotifPermission(): Promise<BrowserNotifPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  try {
    const res = await window.Notification.requestPermission();
    return res;
  } catch {
    return window.Notification.permission;
  }
}

export function playNotificationChime(critical = false): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = critical ? "triangle" : "sine";
    osc.frequency.setValueAtTime(critical ? 880 : 660, ctx.currentTime);
    if (critical) {
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.12);
    }
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (critical ? 0.35 : 0.22));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (critical ? 0.36 : 0.24));
  } catch {
    /* ignore audio policy restrictions before user gesture */
  }
}

export function showBrowserNotification(opts: {
  id: string;
  title: string;
  body: string;
  href?: string;
  critical?: boolean;
  onNavigate?: (href: string) => void;
}): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (window.Notification.permission !== "granted") return;
  try {
    const n = new window.Notification(opts.title, {
      body: opts.body,
      tag: opts.id,
      icon: "/logo.svg",
      badge: "/logo.svg",
      requireInteraction: Boolean(opts.critical),
    });
    n.onclick = () => {
      try {
        window.focus();
      } catch {
        /* ignore */
      }
      if (opts.href && opts.href.startsWith("/") && opts.onNavigate) {
        opts.onNavigate(opts.href);
      }
      n.close();
    };
  } catch {
    /* fallback handled by in-app toast */
  }
}
