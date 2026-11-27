"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, CheckCheck, CheckCircle2, Clock, ExternalLink, ListFilter, Siren } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { api } from "@/lib/data/service";
import { subscribeUserSignal } from "@/lib/firebase/realtime";
import {
  getBrowserNotifPermission,
  playNotificationChime,
  requestBrowserNotifPermission,
  showBrowserNotification,
  type BrowserNotifPermission,
} from "@/lib/notifications/browserNotifications";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatTime } from "@/lib/utils/format";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function NotificationsDropdown() {
  const { locale, t } = useLocale();
  const { user } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [perm, setPerm] = useState<BrowserNotifPermission>("default");
  const ref = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setPerm(getBrowserNotifPermission());
  }, []);

  useEffect(() => {
    initializedRef.current = false;
    seenIdsRef.current = new Set();
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
      const rows = Array.isArray(data) ? data : [];

      if (!initializedRef.current) {
        rows.forEach((n: any) => seenIdsRef.current.add(String(n.id)));
        initializedRef.current = true;
      } else {
        const fresh = rows.filter((n: any) => !seenIdsRef.current.has(String(n.id)) && !n.readAt);
        if (fresh.length > 0) {
          fresh.forEach((n: any) => seenIdsRef.current.add(String(n.id)));
          const top = fresh[0];
          if (top) {
            const title = String(ar ? top.titleAr : top.titleEn);
            const body = String(ar ? top.bodyAr : top.bodyEn);
            const href = typeof top?.data?.href === "string" ? top.data.href : "/notifications";
            const isCritical = top?.data?.category === "EMERGENCY_ALERT" || top?.data?.severity === "CRITICAL";

            playNotificationChime(isCritical);
            push(isCritical ? "error" : "info", title, body);
            showBrowserNotification({
              id: String(top.id),
              title,
              body,
              href,
              critical: isCritical,
              onNavigate: (target) => router.push(target),
            });
          }
        }
      }

      setNotifs(rows);
    } catch (e) {
      console.error(e);
    }
  }, [user, open, ar, push, router]);

  useEffect(() => {
    void fetchNotifs();
    const int = setInterval(fetchNotifs, 5000);
    const onPulse = () => void fetchNotifs();
    window.addEventListener("mnis:refresh-notifs", onPulse);
    const unsub = user?.id ? subscribeUserSignal(user.id, () => void fetchNotifs()) : () => {};
    return () => {
      clearInterval(int);
      window.removeEventListener("mnis:refresh-notifs", onPulse);
      unsub();
    };
  }, [fetchNotifs, user?.id]);

  const unreadCount = useMemo(() => notifs.filter((n) => !n.readAt).length, [notifs]);

  const handleEnableBrowserNotifs = async () => {
    const next = await requestBrowserNotifPermission();
    setPerm(next);
    if (next === "granted") {
      push("success", ar ? "تم تفعيل إشعارات المتصفح الحية بنجاح" : "Live browser notifications enabled");
      try {
        await api.testSelfNotification();
        void fetchNotifs();
      } catch {
        /* non-blocking */
      }
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.readAt) {
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
    try {
      await api.markAllNotificationsRead();
      setNotifs((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative flex items-center gap-1.5" ref={ref}>
      {perm === "default" && (
        <button
          type="button"
          onClick={handleEnableBrowserNotifs}
          className="hidden md:inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/15 transition-colors"
          title={ar ? "اضغط لتفعيل إشعارات المتصفح الحية" : "Enable browser notifications"}
        >
          <BellRing className="h-3.5 w-3.5" />
          <span>{ar ? "تفعيل إشعارات المتصفح" : "Enable Alerts"}</span>
        </button>
      )}

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
        <div className="absolute top-full mt-2 end-0 w-80 sm:w-96 max-h-[30rem] overflow-y-auto bg-surface-container-lowest border border-outline-variant/40 shadow-level-3 rounded-xl z-50 flex flex-col">
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

          {perm === "default" && (
            <div className="flex items-center justify-between gap-2 bg-primary/5 border-b border-primary/20 px-3 py-2 text-[11px]">
              <span className="text-on-surface font-medium">
                {ar ? "فعّل إشعارات المتصفح لاستقبال التنبيهات فوراً" : "Enable OS browser alerts for real-time updates"}
              </span>
              <button
                type="button"
                onClick={handleEnableBrowserNotifs}
                className="shrink-0 rounded-md bg-primary px-2 py-1 text-[10px] font-bold text-on-primary hover:opacity-90"
              >
                {ar ? "تفعيل الآن" : "Allow"}
              </button>
            </div>
          )}

          <div className="flex flex-col">
            {notifs.length === 0 ? (
              <div className="p-6 text-center text-sm text-on-surface-variant flex flex-col items-center gap-2">
                <CheckCircle2 className="h-6 w-6 opacity-30" />
                {ar ? "لا يوجد إشعارات حقيقية مسجلة حتى الآن" : "No notifications recorded yet"}
              </div>
            ) : (
              notifs.slice(0, 12).map((n) => {
                const unread = !n.readAt;
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

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/notifications");
            }}
            className="sticky bottom-0 flex items-center justify-center gap-1.5 border-t border-outline-variant/40 bg-surface-container-low p-2.5 text-xs font-bold text-primary hover:bg-surface-container"
          >
            <ListFilter className="h-3.5 w-3.5" />
            {ar ? "فتح شاشة الإشعارات الكاملة" : "Open Full Notifications Center"}
          </button>
        </div>
      )}
    </div>
  );
}
