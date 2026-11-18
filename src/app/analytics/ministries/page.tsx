"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  ShieldCheck,
  Thermometer,
  Pill,
  AlertOctagon,
  RefreshCw,
  Users,
  TestTubes,
  Droplets,
  Siren,
  HeartPulse,
  ClipboardCheck,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function MohpStrategicDecisionsPage() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  const handleError = useApiError();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getQuadMinistries();
      setData(res);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const mohp = data?.mohp;
  const metrics = mohp?.liveDbMetrics;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Activity}
        title={
          ar
            ? "القرارات الاستراتيجية لوزارة الصحة والسكان"
            : "Ministry of Health & Population — Strategic Decisions"
        }
        badge={
          ar
            ? "غرفة القرار الوطني • 120 مليون مواطن"
            : "National Health Command • 120M Base"
        }
        meta={
          <span className="text-xs text-on-surface-variant font-mono">
            {ar
              ? "تحليل لحظي للإنذار الوبائي المبكر وسلسلة التبريد والمخزون الدوائي الحرج"
              : "Real-time epidemic surveillance, vaccine cold-chain & critical drug reserves"}
          </span>
        }
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={loading}
            icon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />}
          >
            {ar ? "تحديث البيانات اللحظية" : "Refresh"}
          </Button>
        }
      />

      {loading && !data && (
        <Card>
          <CardContent className="p-12 text-center text-sm text-on-surface-variant">
            {ar
              ? "جاري تحميل المؤشرات والقرارات الاستراتيجية لوزارة الصحة..."
              : "Loading Ministry of Health strategic indicators..."}
          </CardContent>
        </Card>
      )}

      {mohp && (
        <div className="flex flex-col gap-6">
          {/* Live Ministry of Health KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard
              icon={Users}
              label={ar ? "المواطنون المقيدون" : "Registered Citizens"}
              value={Number(metrics?.registeredCitizens ?? 0).toLocaleString()}
              tone="primary"
            />
            <StatCard
              icon={HeartPulse}
              label={ar ? "الزيارات السريرية" : "Clinical Visits"}
              value={Number(metrics?.activeVisits ?? 0).toLocaleString()}
              tone="secondary"
            />
            <StatCard
              icon={Siren}
              label={ar ? "حالات الطوارئ" : "ER Cases"}
              value={Number(metrics?.activeErCases ?? 0).toLocaleString()}
              tone="error"
            />
            <StatCard
              icon={TestTubes}
              label={ar ? "عينات المعمل المرجعي" : "Lab Samples"}
              value={Number(metrics?.labSamplesProcessed ?? 0).toLocaleString()}
              tone="warning"
            />
            <StatCard
              icon={Droplets}
              label={ar ? "وحدات الدم المتاحة" : "Available Blood Units"}
              value={Number(metrics?.availableBloodUnits ?? 0).toLocaleString()}
              tone="success"
            />
          </div>

          {/* Actionable MoHP Strategic Decisions */}
          {Array.isArray(mohp.strategicDecisions) && mohp.strategicDecisions.length > 0 && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  {ar
                    ? "حزمة القرارات الاستراتيجية التنفيذية لوزارة الصحة والسكان"
                    : "Executive Strategic Decisions — Ministry of Health & Population"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {mohp.strategicDecisions.map((dec: any) => (
                  <div
                    key={dec.id}
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-low/50 p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-secondary">
                          {ar ? dec.domainAr : dec.domainEn}
                        </span>
                        <Badge
                          tone={
                            dec.priority === "CRITICAL"
                              ? "error"
                              : dec.priority === "HIGH"
                              ? "warning"
                              : "success"
                          }
                        >
                          {dec.priority}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface">
                        {ar ? dec.titleAr : dec.titleEn}
                      </h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {ar ? dec.rationaleAr : dec.rationaleEn}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-container-lowest p-2.5 border border-outline-variant/30 text-xs font-medium text-primary">
                      <ShieldCheck className="inline h-3.5 w-3.5 me-1.5 text-tertiary" />
                      {ar ? dec.actionAr : dec.actionEn}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Outbreak Alert Banner */}
          <Card className="border-red-500/40 bg-red-950/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertOctagon className="h-6 w-6 text-red-500 animate-pulse" />
                <div>
                  <CardTitle className="text-red-500">
                    {ar
                      ? "نظام الرصد الوبائي المبكر (Z-Score Outbreak Alerts)"
                      : "Outbreak Detection Engine (Z-Score)"}
                  </CardTitle>
                  <p className="text-xs text-on-surface-variant">
                    {ar
                      ? "تحليل انحراف الحالات الحادة عن المعدل الطبيعي بالمحافظات لاتخاذ قرار التدخل السريع"
                      : "Epidemiological deviation from baseline across governorates"}
                  </p>
                </div>
              </div>
              <Badge tone="error">{ar ? "حالة تأهب نشطة" : "Active Alerts"}</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mohp.outbreakAlerts.map((alert: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-surface p-4 rounded-xl border border-outline-variant/30 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-on-surface">{alert.governorate}</span>
                        <Badge
                          tone={
                            alert.status === "CRITICAL_OUTBREAK"
                              ? "error"
                              : alert.status === "WATCH"
                              ? "warning"
                              : "success"
                          }
                        >
                          Z = {alert.zScore}
                        </Badge>
                      </div>
                      <p className="text-xs text-on-surface-variant mb-2">{alert.syndrome}</p>
                    </div>
                    <div className="pt-2 border-t border-outline-variant/20 flex justify-between text-xs text-on-surface-variant">
                      <span>
                        {ar ? "الحالات الحالية:" : "Active:"}{" "}
                        <strong className="text-on-surface">{alert.activeCases}</strong>
                      </span>
                      <span>
                        {ar ? "المعدل الطبيعي:" : "Baseline:"} {alert.baseline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vaccine Cold-Chain & Strategic Drug Reserves */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-emerald-500" />
                  {ar
                    ? "سلسلة التبريد ومخزون الأمصال واللقاحات القومية"
                    : "Vaccine Cold-Chain Telemetry & Strategic Reserves"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-3 bg-surface-container rounded-lg">
                  <span className="text-sm font-semibold">
                    {ar
                      ? `سلامة درجات الحرارة (${mohp.vaccineColdChain.activeSensors} مستشعراً):`
                      : `Telemetry Compliance (${mohp.vaccineColdChain.activeSensors} Sensors):`}
                  </span>
                  <span className="text-emerald-500 font-bold">
                    {mohp.vaccineColdChain.telemetryCompliancePct}%
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {mohp.vaccineColdChain.strategicReserves.map((v: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border border-outline-variant/30 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-bold text-on-surface">{v.vaccineName}</p>
                        <p className="text-xs text-on-surface-variant">
                          {ar
                            ? `مخزون استراتيجي يكفي: ${v.targetBufferMonths} أشهر`
                            : `Buffer: ${v.targetBufferMonths} Months`}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold bg-surface-container-high px-2.5 py-1 rounded">
                        {Number(v.availableDoses).toLocaleString()} {ar ? "جرعة" : "Doses"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-cyan-500" />
                  {ar
                    ? "المخزون الاستراتيجي للأدوية الحرجة والمنقذة للحياة"
                    : "Critical Emergency Drug Buffers"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {mohp.strategicDrugReserves.map((d: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-outline-variant/30 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-bold text-on-surface">{d.category}</p>
                      <p className="text-xs text-on-surface-variant">
                        {ar
                          ? `رصيد الجمهورية: ${d.nationalStockDays} يوم استهلاك`
                          : `National Stock: ${d.nationalStockDays} Days`}
                      </p>
                    </div>
                    <Badge tone={d.status === "OPTIMAL" ? "success" : "warning"}>
                      {d.status === "OPTIMAL"
                        ? ar
                          ? "رصيد آمن"
                          : "Optimal"
                        : ar
                        ? "إعادة طلب"
                        : "Reorder"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
