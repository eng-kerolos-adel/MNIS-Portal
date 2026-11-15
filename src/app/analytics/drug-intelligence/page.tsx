"use client";

import { useEffect, useState, useCallback } from "react";
import { Pill, TrendingUp, CheckSquare, Activity } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function DrugIntelligencePage() {
  const { locale, dir } = useLocale();
  const ar = locale === "ar";
  const handleError = useApiError();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsDrugIntel();
      setData(res);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalChronic = data?.chronicRatio?.chronic || 0;
  const totalAcute = data?.chronicRatio?.acute || 0;
  const totalRx = totalChronic + totalAcute;
  const chronicPct = totalRx > 0 ? (totalChronic / totalRx) * 100 : 0;
  const acutePct = totalRx > 0 ? (totalAcute / totalRx) * 100 : 0;

  // Find max counts for progress bars
  const maxPrescribed = data?.topPrescribed?.length > 0 ? Math.max(...data.topPrescribed.map((d: any) => d.count)) : 0;
  const maxDispensed = data?.topDispensed?.length > 0 ? Math.max(...data.topDispensed.map((d: any) => d.count)) : 0;

  return (
    <div className="space-y-6" dir={dir}>
      <PageHeader
        title={ar ? "الذكاء الدوائي" : "Drug Intelligence"}
        meta={ar ? "تحليل اتجاهات وصف وصرف الأدوية." : "Analyze medication prescribing and dispensing trends."}
        icon={Pill}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Prescribed */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>{ar ? "الأكثر وصفاً (Top 20)" : "Top Prescribed (Top 20)"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topPrescribed?.map((d: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{d.nameEn}</span>
                    <span className="text-muted-foreground">{d.count}</span>
                  </div>
                  <Progress value={maxPrescribed > 0 ? (d.count / maxPrescribed) * 100 : 0} className="h-2" />
                </div>
              ))}
              {(!data?.topPrescribed || data.topPrescribed.length === 0) && (
                 <p className="text-center text-muted-foreground py-4">{ar ? "لا توجد بيانات" : "No data available"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Top Dispensed */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <CardTitle>{ar ? "الأكثر صرفاً (Top 10)" : "Top Dispensed (Top 10)"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topDispensed?.map((d: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{d.nameEn}</span>
                      <span className="text-muted-foreground">{d.count}</span>
                    </div>
                    <Progress value={maxDispensed > 0 ? (d.count / maxDispensed) * 100 : 0} className="h-2 bg-emerald-100 dark:bg-emerald-950 [&>div]:bg-emerald-600" />
                  </div>
                ))}
                {(!data?.topDispensed || data.topDispensed.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">{ar ? "لا توجد بيانات" : "No data available"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chronic vs Acute Ratio */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <CardTitle>{ar ? "نسبة الوصفات المزمنة للعادية" : "Chronic vs Acute Prescriptions"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-purple-700 dark:text-purple-400">{ar ? "مزمنة" : "Chronic"}</span>
                    <span>{totalChronic} ({chronicPct.toFixed(1)}%)</span>
                  </div>
                  <Progress value={chronicPct} className="h-3 bg-purple-100 dark:bg-purple-950 [&>div]:bg-purple-600" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">{ar ? "عادية (حادة)" : "Acute"}</span>
                    <span>{totalAcute} ({acutePct.toFixed(1)}%)</span>
                  </div>
                  <Progress value={acutePct} className="h-3 bg-blue-100 dark:bg-blue-950 [&>div]:bg-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
