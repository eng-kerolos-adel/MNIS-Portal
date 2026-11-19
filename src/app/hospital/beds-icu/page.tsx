"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BedDouble, HeartPulse, Sparkles, ShieldAlert } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import type { Bed } from "@/types/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { DonutRing } from "@/components/charts/DonutRing";
import { pick } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const STATUS_STYLE: Record<Bed["status"], string> = {
  available: "bg-success-container text-on-success-container",
  occupied: "bg-primary-container text-on-primary-container",
  cleaning: "bg-warning-container text-on-warning-container",
  reserved: "bg-secondary-container text-on-secondary-container",
  maintenance: "bg-error-container text-on-error-container",
};

const STATUS_LABEL: Record<Bed["status"], { en: string; ar: string }> = {
  available: { en: "Available", ar: "متاح" },
  occupied: { en: "Occupied", ar: "مشغول" },
  cleaning: { en: "Cleaning", ar: "تحت التنظيف" },
  reserved: { en: "Reserved", ar: "محجوز" },
  maintenance: { en: "Maintenance", ar: "صيانة" },
};

export default function BedsIcuPage() {
  const { locale, t } = useLocale();
  const { user: me } = useAuth();
  const { push } = useToast();
  const handleError = useApiError();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [wardFilter, setWardFilter] = useState<string>("all");

  const load = useCallback(async () => { try { setBeds(await api.getBeds()); } catch (e) { handleError(e); } }, [handleError]);
  useEffect(() => { void load(); }, [load]);

  const wards = useMemo(() => Array.from(new Set(beds.map((b) => pick(b.ward, locale)))), [beds, locale]);
  const filtered = wardFilter === "all" ? beds : beds.filter((b) => pick(b.ward, locale) === wardFilter);

  const occupied = beds.filter((b) => b.status === "occupied").length;
  const available = beds.filter((b) => b.status === "available").length;
  const occupancyPct = beds.length ? Math.round((occupied / beds.length) * 100) : 0;
  const icuCritical = beds.filter((b) => b.ward.en.startsWith("ICU") && (b.acuity ?? 5) <= 2).length;

  // OCCUPIED is reached only by admitting an ER case (server rule); staff can release/reserve/clean/maintain.
  async function cycleStatus(bed: Bed) {
    const order: Bed["status"][] = ["available", "reserved", "cleaning", "maintenance"];
    if (bed.status === "occupied" && !window.confirm(locale === "ar" ? "تأكيد إخلاء السرير (خروج المريض)؟" : "Confirm releasing this bed (patient leaves)?")) return;
    const next = bed.status === "occupied" ? "cleaning" : order[(order.indexOf(bed.status) + 1) % order.length]!;
    try { await api.setBedStatus(bed.id, next); await load(); } catch (e) { handleError(e); }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={BedDouble}
        title={locale === "ar" ? "إدارة الأسرة والعناية المركزة" : "Bed & ICU capacity management"}
        badge={(locale === "ar" ? me?.facilityAr : me?.facilityEn) || (locale === "ar" ? "مركز إدارة الأسرة والعناية" : "Hospital Bed & ICU Center")}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={BedDouble} label={locale === "ar" ? "أسرة متاحة" : "Available beds"} value={available} tone="success" />
        <StatCard icon={HeartPulse} label={locale === "ar" ? "أسرة مشغولة" : "Occupied beds"} value={occupied} tone="primary" />
        <StatCard icon={ShieldAlert} label={locale === "ar" ? "حالات حرجة بالعناية" : "Critical ICU cases"} value={icuCritical} tone="error" />
        <StatCard icon={Sparkles} label={locale === "ar" ? "إجمالي الأسرة" : "Total beds"} value={beds.length} tone="secondary" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-3 p-6 lg:col-span-1">
          <DonutRing
            pct={occupancyPct}
            size={140}
            stroke={14}
            className={occupancyPct > 85 ? "text-error" : occupancyPct > 70 ? "text-warning" : "text-success"}
            label={
              <div className="flex flex-col">
                <span className="text-2xl font-bold tabular-nums text-on-surface">{occupancyPct}%</span>
                <span className="text-[10px] text-on-surface-variant">{locale === "ar" ? "نسبة الإشغال" : "occupancy"}</span>
              </div>
            }
          />
          <p className="text-center text-xs text-on-surface-variant">
            {locale === "ar" ? `${occupied} من ${beds.length} سرير مشغول حالياً` : `${occupied} of ${beds.length} beds currently occupied`}
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-wrap gap-2">
            <CardTitle>{locale === "ar" ? "خريطة الأسرة" : "Bed map"}</CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setWardFilter("all")}
                className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", wardFilter === "all" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant")}
              >
                {t("common.all")}
              </button>
              {wards.map((w) => (
                <button
                  key={w}
                  onClick={() => setWardFilter(w)}
                  className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", wardFilter === w ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant")}
                >
                  {w}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {filtered.map((bed) => (
                <button
                  key={bed.id}
                  onClick={() => cycleStatus(bed)}
                  title={`${bed.bedNumber} — ${pick(STATUS_LABEL[bed.status], locale)}`}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-bold transition-transform hover:scale-105",
                    STATUS_STYLE[bed.status]
                  )}
                >
                  <BedDouble className="h-4 w-4" />
                  {bed.bedNumber}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-on-surface-variant">
              {(Object.keys(STATUS_LABEL) as Bed["status"][]).map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_STYLE[s].split(" ")[0])} />
                  {pick(STATUS_LABEL[s], locale)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
