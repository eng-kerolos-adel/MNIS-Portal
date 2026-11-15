"use client";

import { useEffect, useState, useCallback } from "react";
import { LineChart, Activity, Clock, TestTube } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function LabAnalyticsPage() {
  const { locale, dir } = useLocale();
  const ar = locale === "ar";
  const handleError = useApiError();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getLabAnalytics();
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

  const maxPanel = data?.topPanels?.length > 0 ? Math.max(...data.topPanels.map((p: any) => p.count)) : 0;

  return (
    <div className="space-y-6" dir={dir}>
      <PageHeader
        title={ar ? "إحصائيات وتقارير المعمل" : "Lab Analytics & Reports"}
        meta={ar ? "مؤشرات الأداء لشهر الحالي من عينات، أوقات الاستجابة، والنتائج غير الطبيعية." : "Current month KPIs for samples, turnaround times, and abnormal results."}
        icon={LineChart}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Samples */}
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-primary/10 text-primary rounded-full">
              <TestTube className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{ar ? "إجمالي العينات" : "Total Samples"}</p>
              <h3 className="text-3xl font-bold">{data?.totalSamplesThisMonth || 0}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Turnaround Time */}
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 text-blue-500 rounded-full">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{ar ? "متوسط سرعة الإنجاز" : "Avg Turnaround Time"}</p>
              <h3 className="text-3xl font-bold text-blue-600">{(data?.avgTurnaroundHours || 0).toFixed(1)} <span className="text-lg text-muted-foreground font-normal">{ar ? "ساعات" : "hrs"}</span></h3>
            </div>
          </CardContent>
        </Card>

        {/* Abnormal Rate */}
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-destructive/10 text-destructive rounded-full">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{ar ? "معدل النتائج الحرجة" : "Abnormal Rate"}</p>
              <h3 className="text-3xl font-bold text-destructive">{(data?.abnormalRate || 0).toFixed(1)}%</h3>
            </div>
          </CardContent>
        </Card>

        {/* Top Panels */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>{ar ? "التحاليل الأكثر طلباً (هذا الشهر)" : "Top Ordered Panels (This Month)"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topPanels?.length > 0 ? (
              <div className="space-y-4">
                {data.topPanels.map((p: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{p.panelEn}</span>
                      <span className="text-muted-foreground">{p.count}</span>
                    </div>
                    <Progress value={maxPanel > 0 ? (p.count / maxPanel) * 100 : 0} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">{ar ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
