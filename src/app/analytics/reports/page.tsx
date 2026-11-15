"use client";

import { useEffect, useState } from "react";
import { FileText, Download, FileSpreadsheet, FileBarChart, Printer, Building2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/* eslint-disable @typescript-eslint/no-explicit-any */
const REPORTS = [
  { id: "ministries", icon: Building2, en: "Quad-Ministry Strategic Executive Report", ar: "التقرير السيادي للوزارات الأربعة المترابطة" },
  { id: "financial", icon: FileSpreadsheet, en: "UHIA Financial Settlement Ledger", ar: "تقرير التسويات المالية والمطالبات التأمينية" },
  { id: "epidemiology", icon: FileBarChart, en: "National Epidemiological & GIS Summary", ar: "الملخص الوبائي الجغرافي ومعدلات الأمراض" },
  { id: "inventory", icon: FileText, en: "Strategic Pharmacy & Lab Reagents Stock", ar: "جرد المخزون الاستراتيجي للأدوية والكواشف" },
];

export default function ReportsPage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";

  const [selected, setSelected] = useState("ministries");
  const [busy, setBusy] = useState(false);
  const [previewRows, setPreviewRows] = useState<{ label: string; value: string }[]>([]);

  const loadPreview = async (reportId: string) => {
    setBusy(true);
    try {
      if (reportId === "ministries") {
        const q = await api.getQuadMinistries();
        setPreviewRows([
          { label: ar ? "إجمالي المواطنين المقيدين بالقاعدة" : "Live Registered Citizens", value: String(q.mohp?.liveDbMetrics?.registeredCitizens ?? q.activeSystemCoverage ?? 0) },
          { label: ar ? "إنذارات التفشي الوبائي النشطة (MoHP)" : "Active Outbreak Alerts (MoHP)", value: String(q.mohp?.outbreakAlerts?.length ?? 0) },
          { label: ar ? "توصيات تعديل تنسيق كليات الطب والتمريض (MoHESR)" : "Faculty Cutoff Recommendations (MoHESR)", value: String(q.mohesr?.facultyAdmissionRecommendations?.length ?? 0) },
          { label: ar ? "أسر وصلت لسقف الـ 5 أفراد بالتموين (MoSIT)" : "Families at 5-Member Ration Cap (MoSIT)", value: Number(q.mosit?.familiesExceedingCap ?? 0).toLocaleString() },
          { label: ar ? "الوفر المالي السنوي لوزارة التموين" : "Annual Ration Subsidy Savings (EGP)", value: `${Number(q.mosit?.estimatedAnnualSubsidySavingsEgp ?? 0).toLocaleString()} EGP` },
          { label: ar ? "نسبة إتمام التكليف الطبي (MoL)" : "Medical Takleef Fulfillment (MoL)", value: `${q.mol?.compulsoryAssignmentRatePct ?? 0}%` },
        ]);
      } else if (reportId === "financial") {
        const [claims, settlements] = await Promise.all([api.getPharmacyClaims(), api.getPharmacySettlements()]);
        const totalEgp = claims.reduce((s, c) => s + Number(c.insuranceCoverEgp ?? c.insuranceAmount ?? 0), 0);
        setPreviewRows([
          { label: ar ? "إجمالي المطالبات المسجلة" : "Total Pharmacy Claims", value: String(claims.length) },
          { label: ar ? "إجمالي دفعات التسوية المعتمدة" : "Audited Settlement Batches", value: String(settlements.length) },
          { label: ar ? "إجمالي التغطية التأمينية (ج.م)" : "Total UHIA Coverage (EGP)", value: `${totalEgp.toFixed(2)} EGP` },
        ]);
      } else if (reportId === "epidemiology") {
        const gis = await api.getAnalyticsGis();
        const govs = Array.isArray(gis) ? gis : (gis.governorates ?? []);
        setPreviewRows(
          govs.map((g: any) => ({
            label: `${g.governorate || (ar ? g.nameAr : g.nameEn)}`,
            value: `${g.chronicConditionsCount ?? g.activeCases ?? 0} ${ar ? "حالة مزمنة" : "chronic cases"} — ${g.patientCount ?? g.patientsCount ?? 0} ${ar ? "مواطن" : "citizens"}`,
          }))
        );
      } else {
        const [drugs, reagents] = await Promise.all([api.getPharmacyInventory(), api.getLabReagents()]);
        setPreviewRows([
          { label: ar ? "أصناف الأدوية المسجلة بالصيدلية" : "Pharmacy Drug SKUs", value: String(drugs.length) },
          { label: ar ? "أصناف الكواشف والمحاليل المعملية" : "Lab Reagent SKUs", value: String(reagents.length) },
          { label: ar ? "كواشف تحت الحد الأدنى" : "Low-Stock Reagents", value: String(reagents.filter((r: any) => r.quantity <= r.lowStockAt).length) },
        ]);
      }
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void loadPreview(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const exportCsv = () => {
    const header = "Metric,Value\n";
    const body = previewRows.map((r) => `"${r.label.replace(/"/g, '""')}","${r.value.replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob(["\uFEFF" + header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MNIS-${selected}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    push("success", ar ? "تم تصدير ملف CSV بنجاح" : "CSV Report Exported");
  };

  const printReport = () => {
    window.print();
  };

  const activeReport = REPORTS.find((r) => r.id === selected) ?? REPORTS[0]!;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader icon={FileText} title={ar ? "التقارير الرسمية السيادية والتصدير الفوري" : "Official National Reports & Live Data Export"} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>{ar ? "نوع التقرير الرسمي" : "Report Category"}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {REPORTS.map((r) => {
              const Icon = r.icon;
              const isActive = selected === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-start transition-colors ${
                    isActive ? "border-primary bg-primary/10 text-primary" : "border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="font-semibold text-sm">{ar ? r.ar : r.en}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{ar ? activeReport.ar : activeReport.en}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-xl border border-outline-variant/40 divide-y divide-outline-variant/30">
              {busy ? (
                <p className="p-8 text-center text-sm text-on-surface-variant">{ar ? "جاري استخراج البيانات الحية من قاعدة البيانات..." : "Fetching live metrics from database..."}</p>
              ) : (
                previewRows.map((row, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-4 text-sm">
                    <span className="text-on-surface-variant font-medium">{row.label}</span>
                    <span className="font-mono font-bold text-on-surface">{row.value}</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-outline-variant/40 flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={printReport} icon={<Printer className="h-4 w-4" />}>
                {ar ? "طباعة التقرير الرسمي / PDF" : "Print Official Report / PDF"}
              </Button>
              <Button loading={busy} onClick={exportCsv} icon={<Download className="h-4 w-4" />}>
                {ar ? "تصدير البيانات الحية (CSV)" : "Export Live Data (CSV)"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
