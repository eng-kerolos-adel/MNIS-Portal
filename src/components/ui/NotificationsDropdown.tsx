"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, CheckCircle2, Clock, ExternalLink, Siren } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { api } from "@/lib/data/service";
import { subscribeUserSignal } from "@/lib/firebase/realtime";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatTime } from "@/lib/utils/format";

/* eslint-disable @typescript-eslint/no-explicit-any */

function getReadOpIds(userId?: string): string[] {
  if (!userId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`mnis.readNotifs.${userId}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveReadOpIds(userId: string | undefined, ids: string[]) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`mnis.readNotifs.${userId}`, JSON.stringify(ids.slice(-100)));
  } catch {
    /* ignore storage quota errors */
  }
}

export function NotificationsDropdown() {
  const { locale, t } = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [readOpIds, setReadOpIds] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReadOpIds(getReadOpIds(user?.id));
  }, [user?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    if (typeof document !== "undefined" && document.hidden && !open) return;
    try {
      const data = await api.getNotifications();
      setNotifs(data);
    } catch (e) {
      console.error(e);
    }
  }, [user, open]);

  useEffect(() => {
    void fetchNotifs();
    const int = setInterval(fetchNotifs, 20000);
    const onPulse = () => void fetchNotifs();
    window.addEventListener("mnis:refresh-notifs", onPulse);
    const unsub = user?.id ? subscribeUserSignal(user.id, () => void fetchNotifs()) : () => {};
    return () => {
      clearInterval(int);
      window.removeEventListener("mnis:refresh-notifs", onPulse);
      unsub();
    };
  }, [fetchNotifs, user?.id]);

  const readOpSet = useMemo(() => new Set(readOpIds), [readOpIds]);
  const isUnread = useCallback(
    (n: any) => (String(n.id).startsWith("op:") ? !readOpSet.has(n.id) : !n.readAt),
    [readOpSet],
  );

  const unreadCount = useMemo(() => notifs.filter(isUnread).length, [notifs, isUnread]);

  const handleNotificationClick = async (n: any) => {
    const isOp = String(n.id).startsWith("op:");
    if (isOp) {
      const next = Array.from(new Set([...readOpIds, String(n.id)]));
      setReadOpIds(next);
      saveReadOpIds(user?.id, next);
    } else if (!n.readAt) {
      try {
        await api.markNotificationRead(n.id);
        setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      } catch (e) {
        console.error(e);
      }
    }

    const href = typeof n?.data?.href === "string" ? n.data.href : "";
    if (href && href.startsWith("/")) {
      setOpen(false);
      router.push(href);
    }
  };

  const handleMarkAllRead = async () => {
    const opIds = notifs.filter((n) => String(n.id).startsWith("op:")).map((n) => String(n.id));
    if (opIds.length > 0) {
      const merged = Array.from(new Set([...readOpIds, ...opIds]));
      setReadOpIds(merged);
      saveReadOpIds(user?.id, merged);
    }
    try {
      await api.markAllNotificationsRead();
      setNotifs((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          void fetchNotifs();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
        aria-label={t("common.notifications")}
        title={t("common.notifications")}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -end-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[9px] font-black text-on-error">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 end-0 w-80 sm:w-96 max-h-[28rem] overflow-y-auto bg-surface-container-lowest border border-outline-variant/40 shadow-level-3 rounded-xl z-50 flex flex-col">
          <div className="flex items-center justify-between gap-2 p-3 border-b border-outline-variant/40 bg-surface-container-low sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{t("common.notifications")}</span>
              {unreadCount > 0 && (
                <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} {ar ? "غير مقروء" : "Unread"}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {ar ? "تحديد الكل كمقروء" : "Mark all read"}
              </button>
            )}
          </div>
          <div className="flex flex-col">
            {notifs.length === 0 ? (
              <div className="p-6 text-center text-sm text-on-surface-variant flex flex-col items-center gap-2">
                <CheckCircle2 className="h-6 w-6 opacity-30" />
                {ar ? "لا يوجد إشعارات أو تنبيهات حالياً" : "No notifications at the moment"}
              </div>
            ) : (
              notifs.map((n) => {
                const unread = isUnread(n);
                const isEmergency = n?.data?.category === "EMERGENCY_ALERT";
                const isCritical = isEmergency || n?.data?.severity === "CRITICAL";
                const href = typeof n?.data?.href === "string" ? n.data.href : "";
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "flex flex-col text-start p-3 border-b border-outline-variant/20 hover:bg-surface-container transition-colors relative",
                      isEmergency && unread
                        ? "bg-error/10 border-s-4 border-s-error"
                        : unread
                          ? "bg-primary/5"
                          : "opacity-75"
                    )}
                  >
                    {unread && (
                      <span
                        className={cn(
                          "absolute start-1.5 top-3.5 h-2 w-2 rounded-full",
                          isCritical ? "bg-error animate-pulse" : "bg-primary"
                        )}
                      />
                    )}
                    <div className={cn("flex items-start justify-between gap-2", unread ? "ms-3" : "ms-0")}>
                      <span className={cn("text-xs sm:text-sm font-bold flex items-center gap-1.5", isEmergency ? "text-error" : "text-on-surface")}>
                        {isEmergency && <Siren className="h-3.5 w-3.5 shrink-0" />}
                        {ar ? n.titleAr : n.titleEn}
                      </span>
                      {href && <ExternalLink className="h-3 w-3 shrink-0 text-on-surface-variant mt-0.5" />}
                    </div>
                    <span className={cn("text-xs text-on-surface-variant mt-0.5 line-clamp-2", unread ? "ms-3" : "ms-0")}>
                      {ar ? n.bodyAr : n.bodyEn}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/70 mt-2 self-end">
                      <Clock className="h-3 w-3" />
                      {formatDate(n.sentAt, locale)} {formatTime(n.sentAt, locale)}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
