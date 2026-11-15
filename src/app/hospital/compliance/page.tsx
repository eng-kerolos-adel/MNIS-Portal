"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardCheck, Clock, Activity, AlertOctagon, TrendingDown, Users } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function CompliancePage() {
  const { locale, dir } = useLocale();
  const ar = locale === "ar";
  const handleError = useApiError();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getHospitalCompliance();
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

  return (
    <div className="space-y-6" dir={dir}>
      <PageHeader
        title={ar ? "الامتثال والجودة" : "Compliance & Quality"}
        meta={ar ? "مؤشرات الأداء القياسية للمستشفى (وقت الانتظار، نسبة الإشغال، معدل الرفض)." : "Standard hospital KPIs (wait times, occupancy rates, rejection rates)."}
        icon={ClipboardCheck}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* ER Wait Time */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <span className={`text-sm font-semibold ${data?.avgWaitMinutes > 30 ? 'text-destructive' : 'text-success'}`}>
                {data?.avgWaitMinutes > 30 ? (ar ? 'أعلى من المعدل' : 'Above Target') : (ar ? 'ضمن المعدل' : 'On Target')}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{ar ? "متوسط وقت انتظار الطوارئ" : "Avg ER Wait Time"}</p>
              <h3 className="text-3xl font-bold mt-1">
                {data?.avgWaitMinutes || 0} <span className="text-lg font-normal text-muted-foreground">{ar ? "دقيقة" : "min"}</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Bed Occupancy */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/10 text-purple-600 rounded-lg">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <p className="text-sm text-muted-foreground">{ar ? "نسبة إشغال الأسرة" : "Bed Occupancy Rate"}</p>
                <h3 className="text-2xl font-bold">{(data?.bedOccupancyPct || 0).toFixed(1)}%</h3>
              </div>
              <Progress value={data?.bedOccupancyPct || 0} className={`h-2 ${(data?.bedOccupancyPct || 0) > 85 ? '[&>div]:bg-destructive' : '[&>div]:bg-purple-600'}`} />
            </div>
          </CardContent>
        </Card>

        {/* ER Rejection Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                <TrendingDown className="w-6 h-6" />
              </div>
              <span className={`text-sm font-semibold ${data?.erRejectionRate > 5 ? 'text-destructive' : 'text-success'}`}>
                {data?.erRejectionRate > 5 ? (ar ? 'مرتفع' : 'High') : (ar ? 'طبيعي' : 'Normal')}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{ar ? "معدل رفض الحالات" : "Cases Rejection Rate"}</p>
              <h3 className="text-3xl font-bold text-destructive mt-1">
                {(data?.erRejectionRate || 0).toFixed(1)}%
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* ER Admissions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{ar ? "إجمالي دخول الطوارئ (الشهر)" : "Total ER Admissions (Month)"}</p>
              <h3 className="text-3xl font-bold mt-1">
                {data?.totalAdmissionsThisMonth || 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Average Acuity */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-500/10 text-orange-600 rounded-lg">
                <AlertOctagon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{ar ? "متوسط خطورة الحالات (Acuity)" : "Average Case Acuity (1-5)"}</p>
              <h3 className="text-3xl font-bold text-orange-600 mt-1">
                {(data?.avgErAcuity || 0).toFixed(1)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{ar ? "1 الأشد خطورة، 5 الأقل" : "1 is most critical, 5 is least"}</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
