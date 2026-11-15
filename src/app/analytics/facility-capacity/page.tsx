"use client";

import { useEffect, useState, useCallback } from "react";
import { BedDouble, Activity, Droplet } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function FacilityCapacityPage() {
  const { locale, dir } = useLocale();
  const ar = locale === "ar";
  const handleError = useApiError();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsFacility();
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

  // Process Bed Data
  const bedsByWard = new Map<string, { total: number, occupied: number }>();
  if (data?.beds) {
    data.beds.forEach((b: any) => {
      if (!bedsByWard.has(b.wardEn)) {
        bedsByWard.set(b.wardEn, { total: 0, occupied: 0 });
      }
      const entry = bedsByWard.get(b.wardEn)!;
      entry.total += b.count;
      if (b.status === "OCCUPIED") {
        entry.occupied += b.count;
      }
    });
  }

  const wardArray = Array.from(bedsByWard.entries()).map(([ward, stats]) => ({
    ward,
    total: stats.total,
    occupied: stats.occupied,
    pct: stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0
  }));

  // Standard Blood Types layout
  const allBloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const bloodData = allBloodTypes.map(bt => {
    const found = data?.bloodUnitsAvailable?.find((u: any) => u.bloodType === bt);
    return { type: bt, count: found ? found.count : 0 };
  });

  return (
    <div className="space-y-6" dir={dir}>
      <PageHeader
        title={ar ? "سعة المنشأة والموارد" : "Facility Capacity"}
        meta={ar ? "مراقبة إشغال الأسرة، المخزون ببنك الدم، وأداء غرف العمليات." : "Monitor bed occupancy, blood bank inventory, and OR performance."}
        icon={BedDouble}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Beds by Ward */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-primary" />
              <CardTitle>{ar ? "إشغال الأسرة حسب القسم" : "Bed Occupancy by Ward"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {wardArray.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {wardArray.map((w, idx) => (
                  <div key={idx} className="space-y-2 p-4 border rounded-lg bg-card">
                    <div className="flex justify-between items-center font-medium">
                      <span>{w.ward}</span>
                      <span className={w.pct > 80 ? "text-destructive" : ""}>
                        {w.pct.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={w.pct} className={`h-2 ${w.pct > 80 ? '[&>div]:bg-destructive' : ''}`} />
                    <div className="text-xs text-muted-foreground text-right">
                      {w.occupied} / {w.total} {ar ? "مشغول" : "occupied"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">{ar ? "لا توجد بيانات للأسرة" : "No bed data available"}</p>
            )}
          </CardContent>
        </Card>

        {/* Blood Bank Inventory */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-red-500" />
              <CardTitle>{ar ? "وحدات الدم المتاحة" : "Available Blood Units"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              {bloodData.map((b, idx) => (
                <div key={idx} className="p-3 border rounded-lg flex flex-col items-center justify-center bg-card">
                  <span className={`text-xl font-bold mb-1 ${b.count === 0 ? 'text-muted-foreground opacity-50' : 'text-red-600 dark:text-red-400'}`}>
                    {b.type}
                  </span>
                  <span className="text-sm font-medium">{b.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* OR Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <CardTitle>{ar ? "أداء غرف العمليات (هذا الشهر)" : "OR Performance (This Month)"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-muted/20"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-blue-500"
                  strokeDasharray={`${data?.orCompletionRate || 0}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{(data?.orCompletionRate || 0).toFixed(0)}%</span>
                <span className="text-xs text-muted-foreground">{ar ? "اكتمال" : "Completion"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
