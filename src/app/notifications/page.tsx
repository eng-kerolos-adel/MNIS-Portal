"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  RefreshCw,
  Send,
  Siren,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { api } from "@/lib/data/service";
import { ROLE_PORTAL, type PortalKey } from "@/lib/nav";
import { formatDate, formatTime } from "@/lib/utils/format";
import {
  getBrowserNotifPermission,
  requestBrowserNotifPermission,
  showBrowserNotification,
  type BrowserNotifPermission,
} from "@/lib/notifications/browserNotifications";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function PortalNotificationsPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const { push } = useToast();
  const router = useRouter();
  const ar = locale === "ar";

  const portalKey: PortalKey = (() => {
    if (!user) return "doctor";
    const spec = (user.specialityEn ?? "").toUpperCase();
    if (spec === "CLINIC_ASSISTANT") return "doctor";
    return ROLE_PORTAL[user.role] ?? "doctor";
  })();

  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "EMERGENCY" | "ADDRESS" | "CLINICAL">("ALL");
  const [query, setQuery] = useState("");
  const [perm, setPerm] = useState<BrowserNotifPermission>("default");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setPerm(getBrowserNotifPermission());
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifs(Array.isArray(data) ? data : []);
    } catch {
      /* ignore transient fetch failure */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const int = setInterval(load, 6000);
    const onPulse = () => void load();
    window.addEventListener("mnis:refresh-notifs", onPulse);
    return () => {
      clearInterval(int);
      window.removeEventListener("mnis:refresh-notifs", onPulse);
    };
  }, [load]);

  async function enableBrowserPermission() {
    const res = await requestBrowserNotifPermission();
    setPerm(res);
    if (res === "granted") {
      push("success", ar ? "تم تفعيل إشعارات المتصفح الحية بنجاح" : "Browser notifications enabled");
    } else if (res === "denied") {
      push(
        "warning",
        ar ? "الإشعارات محجوبة من إعدادات المتصفح — اسمح بها من علامة القفل بجوار الرابط" : "Notifications blocked in browser settings",
      );
    }
  }

  async function sendTestNotification() {
    setTesting(true);
    try {
      let currentPerm = getBrowserNotifPermission();
      if (currentPerm === "default") {
        currentPerm = await requestBrowserNotifPermission();
        setPerm(currentPerm);
      }
      const res = await api.testSelfNotification();
      const created = res?.notification;
      if (created && currentPerm === "granted") {
        showBrowserNotification({
          id: String(created.id),
          title: ar ? created.titleAr : created.titleEn,
          body: ar ? created.bodyAr : created.bodyEn,
          href: "/notifications",
          onNavigate: (target) => router.push(target),
        });
      }
      push(
        "success",
        ar ? "تم إرسال إشعار تجريبي حي وحفظه في السجل" : "Live test notification dispatched",
      );
      await load();
      window.dispatchEvent(new Event("mnis:refresh-notifs"));
    } finally {
      setTesting(false);
    }
  }

  async function markRead(n: any) {
    if (!n.readAt) {
      await api.markNotificationRead(n.id);
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      window.dispatchEvent(new Event("mnis:refresh-notifs"));
    }
    const href = typeof n?.data?.href === "string" ? n.data.href : "";
    if (href && href.startsWith("/") && href !== "/notifications") {
      router.push(href);
    }
  }

  async function markAllRead() {
    await api.markAllNotificationsRead();
    setNotifs((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    window.dispatchEvent(new Event("mnis:refresh-notifs"));
  }

  const unreadCount = useMemo(() => notifs.filter((n) => !n.readAt).length, [notifs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifs.filter((n) => {
      if (filter === "UNREAD" && n.readAt) return false;
      if (filter === "EMERGENCY" && n?.data?.category !== "EMERGENCY_ALERT" && n?.data?.severity !== "CRITICAL") return false;
      if (filter === "ADDRESS" && n?.data?.category !== "ADDRESS_CHANGE" && n?.data?.category !== "ADDRESS_CHANGE_DECIDED") return false;
      if (filter === "CLINICAL" && (n?.data?.category === "EMERGENCY_ALERT" || n?.data?.category === "ADDRESS_CHANGE")) return false;
      if (!q) return true;
      const hay = `${n.titleAr ?? ""} ${n.titleEn ?? ""} ${n.bodyAr ?? ""} ${n.bodyEn ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [notifs, filter, query]);

  return (
    <AppShell portal={portalKey}>
      <div className="flex flex-col gap-5">
        <PageHeader
          icon={Bell}
          title={ar ? "مركز الإشعارات الفورية والتنبيهات الحية" : "Real-Time Notifications Center"}
          badge={`${unreadCount} ${ar ? "غير مقروء" : "Unread"}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={load}>
                {ar ? "تحديث" : "Refresh"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                loading={testing}
                icon={<Send className="h-4 w-4" />}
                onClick={sendTestNotification}
              >
                {ar ? "إرسال إشعار تجريبي للمتصفح" : "Send Test Browser Alert"}
              </Button>
              {unreadCount > 0 && (
                <Button size="sm" icon={<CheckCheck className="h-4 w-4" />} onClick={markAllRead}>
                  {ar ? "تحديد الكل كمقروء" : "Mark All Read"}
                </Button>
              )}
            </div>
          }
        />

        {/* Browser Permission Status Banner */}
        <Card
          className={`border-s-4 ${
            perm === "granted"
              ? "border-s-emerald-600 bg-emerald-500/5"
              : perm === "denied"
                ? "border-s-error bg-error/5"
                : "border-s-primary bg-primary/5"
          }`}
        >
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest shadow-xs">
                <BellRing className={`h-5 w-5 ${perm === "granted" ? "text-emerald-600" : perm === "denied" ? "text-error" : "text-primary"}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  {perm === "granted"
                    ? ar
                      ? "إشعارات المتصفح الحية مفعّلة ✓"
                      : "Live Browser Push Notifications Active ✓"
                    : perm === "denied"
                      ? ar
                        ? "تم حظر إشعارات المتصفح من إعدادات الجهاز"
                        : "Browser Notifications Blocked"
                      : perm === "unsupported"
                        ? ar
                          ? "هذا المتصفح لا يدعم إشعارات سطح المكتب"
                          : "Desktop Notifications Unsupported"
                        : ar
                          ? "اسمح للمتصفح بإظهار الإشعارات الفورية"
                          : "Enable Browser Permission for Live Alerts"}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {perm === "granted"
                    ? ar
                      ? "أي حدث فعلي في المنظومة (حجز جديد، روشتة، تحاليل، نداء طوارئ، طلب تغيير عنوان طبيب) سيظهر فوراً كإشعار متصفح وهنا في السجل."
                      : "Every real system event (bookings, prescriptions, labs, emergency dispatches, address changes) pops up immediately in your browser and here."
                    : perm === "denied"
                      ? ar
                        ? "اضغط على أيقونة القفل بجوار شريط العنوان واختر Allow للـ Notifications ثم أعد تحميل الصفحة."
                        : "Click the lock icon next to the URL bar, set Notifications to Allow, and reload."
                      : ar
                        ? "اضغط تفعيل الآن لطلب صلاحية الإشعارات من المتصفح واستقبال إشعارات حقيقية لحظياً."
                        : "Click Allow Now to grant browser Notification permission."}
                </p>
              </div>
            </div>
            {perm === "default" && (
              <Button icon={<BellRing className="h-4 w-4" />} onClick={enableBrowserPermission}>
                {ar ? "تفعيل إشعارات المتصفح الآن" : "Enable Browser Notifications"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{ar ? `سجل الإشعارات الحية (${filtered.length})` : `Live Event Notifications (${filtered.length})`}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {(["ALL", "UNREAD", "EMERGENCY", "ADDRESS", "CLINICAL"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(k)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    filter === k ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {k === "ALL"
                    ? ar ? "الكل" : "All"
                    : k === "UNREAD"
                      ? ar ? "غير مقروء" : "Unread"
                      : k === "EMERGENCY"
                        ? ar ? "طوارئ" : "Emergency"
                        : k === "ADDRESS"
                          ? ar ? "عناوين الأطباء" : "Addresses"
                          : ar ? "سريري وتشغيلي" : "Clinical"}
                </button>
              ))}
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder={ar ? "بحث في الإشعارات..." : "Filter notifications..."}
                className="w-full sm:w-64"
              />
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-2.5">
            {loading && (
              <p className="py-8 text-center text-sm text-on-surface-variant">
                {ar ? "جاري تحميل الإشعارات..." : "Loading notifications..."}
              </p>
            )}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-on-surface-variant">
                <CheckCircle2 className="h-8 w-8 opacity-30" />
                {ar ? "لا توجد إشعارات مطابقة في هذا التصنيف حالياً." : "No matching notifications right now."}
              </div>
            )}
            {filtered.map((n) => {
              const unread = !n.readAt;
              const isEmergency = n?.data?.category === "EMERGENCY_ALERT";
              const isAddress = n?.data?.category === "ADDRESS_CHANGE" || n?.data?.category === "ADDRESS_CHANGE_DECIDED";
              const href = typeof n?.data?.href === "string" ? n.data.href : "";
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n)}
                  className={`flex flex-col gap-1.5 rounded-xl border p-4 text-start transition hover:shadow-level-1 ${
                    isEmergency && unread
                      ? "border-error/50 bg-error/10"
                      : unread
                        ? "border-primary/35 bg-primary/5"
                        : "border-outline-variant/40 bg-surface-container-lowest opacity-85"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isEmergency && <Siren className="h-4 w-4 text-error" />}
                      {isAddress && <MapPin className="h-4 w-4 text-amber-600" />}
                      <span className={`text-sm font-bold ${isEmergency ? "text-error" : "text-on-surface"}`}>
                        {ar ? n.titleAr : n.titleEn}
                      </span>
                      {unread && <Badge tone="primary">{ar ? "جديد" : "New"}</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(n.sentAt, locale)} • {formatTime(n.sentAt, locale)}
                      </span>
                      {href && href !== "/notifications" && <ExternalLink className="h-3.5 w-3.5 text-primary" />}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    {ar ? n.bodyAr : n.bodyEn}
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
