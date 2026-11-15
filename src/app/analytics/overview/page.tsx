"use client";

import { useCallback, useEffect, useState } from "react";
import { Gauge, ShieldCheck, BedDouble, Siren, PackageCheck, TestTubes, Users, RefreshCw } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { DonutRing } from "@/components/charts/DonutRing";
import { formatNumber, formatTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Kpis = Awaited<ReturnType<typeof api.getKpis>>;

const RX_LABEL: Record<string, { en: string; ar: string }> = {
  DRAFT: { en: "Draft", ar: "مسودة" }, SIGNED: { en: "Signed", ar: "موقّعة" }, VERIFIED: { en: "Verified", ar: "تم التحقق" },
  DISPENSED: { en: "Dispensed", ar: "تم الصرف" }, REJECTED: { en: "Rejected", ar: "مرفوضة" },
};

export default function AnalyticsOverviewPage() {
  const { locale } = useLocale();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [k, setK] = useState<Kpis | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try { setK(await api.getKpis()); } catch (e) { handleError(e); } finally { setBusy(false); }
  }, [handleError]);
  useEffect(() => { void load(); }, [load]);

  const rxTotal = k ? Object.values(k.prescriptions).reduce((a, b) => a + b, 0) : 0;
  const occ = k?.beds.occupancyPct ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Gauge}
        title={ar ? "غرفة القيادة التنفيذية" : "Executive command overview"}
        badge={k ? `${ar ? "آخر تحديث" : "Updated"} ${formatTime(k.generatedAt, locale)}` : undefined}
        meta={<span className="flex items-center gap-1 text-tertiary"><ShieldCheck className="h-3.5 w-3.5" />{ar ? "أرقام حية محسوبة من بيانات المنشأة" : "Live figures computed from facility data"}</span>}
        actions={<Button variant="outline" loading={busy} icon={<RefreshCw className="h-4 w-4" />} onClick={load}>{ar ? "تحديث" : "Refresh"}</Button>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={BedDouble} label={ar ? "أسرة مشغولة" : "Beds occupied"} value={k ? `${k.beds.occupied}/${k.beds.total}` : "—"} tone="primary" />
        <StatCard icon={Siren} label={ar ? "طوارئ مفتوحة" : "Open ER cases"} value={k ? formatNumber(k.er.open, locale) : "—"} sub={k ? `${ar ? "منها حرجة" : "critical"}: ${k.er.critical}` : undefined} tone="error" />
        <StatCard icon={Users} label={ar ? "بالانتظار في العيادات" : "Waiting in clinics"} value={k ? formatNumber(k.clinics.waiting, locale) : "—"} tone="warning" />
        <StatCard icon={TestTubes} label={ar ? "عينات مفتوحة" : "Open lab samples"} value={k ? formatNumber(k.lab.openSamples, locale) : "—"} tone="secondary" />
        <StatCard icon={PackageCheck} label={ar ? "إجمالي الروشتات" : "Prescriptions"} value={k ? formatNumber(rxTotal, locale) : "—"} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-3 p-6">
          <DonutRing pct={occ} size={140} stroke={14} className={occ > 85 ? "text-error" : occ > 70 ? "text-warning" : "text-success"}
            label={<div className="flex flex-col"><span className="text-2xl font-bold tabular-nums text-on-surface">{occ}%</span><span className="text-[10px] text-on-surface-variant">{ar ? "إشغال الأسرة" : "bed occupancy"}</span></div>} />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{ar ? "الروشتات حسب الحالة" : "Prescriptions by status"}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {k && Object.keys(RX_LABEL).map((s) => {
              const n = k.prescriptions[s] ?? 0;
              const pct = rxTotal ? Math.round((n / rxTotal) * 100) : 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm font-semibold text-on-surface">{RX_LABEL[s]![locale]}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-container-high"><div className={cn("h-full rounded-full", s === "REJECTED" ? "bg-error" : s === "DISPENSED" ? "bg-success" : "bg-secondary")} style={{ width: `${pct}%` }} /></div>
                  <span className="w-10 shrink-0 text-end text-sm font-bold tabular-nums text-on-surface">{n}</span>
                </div>
              );
            })}
            {!k && <p className="text-sm text-on-surface-variant">…</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
