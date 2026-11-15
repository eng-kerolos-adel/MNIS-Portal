"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, CheckCircle2, Clock } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { api } from "@/lib/data/service";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatTime } from "@/lib/utils/format";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function NotificationsDropdown() {
  const { locale, t } = useLocale();
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await api.getNotifications();
        setNotifs(data);
      } catch (e) {
        console.error(e);
      }
    };
    if (open) {
      void fetchNotifs();
    } else {
      // also fetch once initially to get unread count
      void fetchNotifs();
    }
    // simple polling every 30s
    const int = setInterval(fetchNotifs, 30000);
    return () => clearInterval(int);
  }, [open]);

  const handleRead = async (n: any) => {
    if (n.readAt) return;
    try {
      await api.markNotificationRead(n.id);
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifs.filter(n => !n.readAt).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
        aria-label={t("common.notifications")}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 end-0 w-80 max-h-96 overflow-y-auto bg-surface-container-lowest border border-outline-variant/40 shadow-level-3 rounded-xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-outline-variant/40 bg-surface-container-low sticky top-0">
            <span className="font-bold text-sm">{t("common.notifications")}</span>
            {unreadCount > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{unreadCount} {ar ? "جديد" : "New"}</span>}
          </div>
          <div className="flex flex-col">
            {notifs.length === 0 ? (
              <div className="p-4 text-center text-sm text-on-surface-variant flex flex-col items-center gap-2">
                <CheckCircle2 className="h-6 w-6 opacity-20" />
                {ar ? "لا يوجد إشعارات" : "No notifications"}
              </div>
            ) : (
              notifs.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleRead(n)}
                  className={cn(
                    "flex flex-col text-start p-3 border-b border-outline-variant/20 hover:bg-surface-container transition-colors relative",
                    !n.readAt ? "bg-primary/5" : "opacity-75"
                  )}
                >
                  {!n.readAt && <span className="absolute start-1.5 top-3 h-1.5 w-1.5 rounded-full bg-primary" />}
                  <span className={cn("text-sm font-semibold mb-0.5", !n.readAt ? "ms-3" : "ms-0")}>{ar ? n.titleAr : n.titleEn}</span>
                  <span className={cn("text-xs text-on-surface-variant line-clamp-2", !n.readAt ? "ms-3" : "ms-0")}>{ar ? n.bodyAr : n.bodyEn}</span>
                  <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/70 mt-2 self-end">
                    <Clock className="h-3 w-3" />
                    {formatDate(n.sentAt, locale)} {formatTime(n.sentAt, locale)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
