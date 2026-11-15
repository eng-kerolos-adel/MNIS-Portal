"use client";

import { useEffect, useState, useCallback } from "react";
import { Map, AlertCircle, HeartPulse } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function GisEpidemiologyPage() {
  const { locale, dir } = useLocale();
  const ar = locale === "ar";
  const handleError = useApiError();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsGis();
      // Sort by highest chronic conditions count
      res.sort((a: any, b: any) => b.chronicConditionsCount - a.chronicConditionsCount);
      setData(res as any[]);
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

  const maxPatientCount = data.length > 0 ? Math.max(...data.map(d => d.patientCount)) : 0;

  return (
    <div className="space-y-6" dir={dir}>
      <PageHeader
        title={ar ? "الخريطة الوبائية" : "GIS Epidemiology"}
        meta={ar ? "توزيع الأمراض المزمنة والحساسية على مستوى المحافظات." : "Distribution of chronic conditions and allergies across governorates."}
        icon={Map}
      />

      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Map className="w-12 h-12 mb-4 opacity-20" />
            <p>{ar ? "لا توجد بيانات متاحة حالياً." : "No GIS data available currently."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((item, idx) => {
            const chronicPct = item.patientCount > 0 ? (item.chronicConditionsCount / item.patientCount) * 100 : 0;
            const allergiesPct = item.patientCount > 0 ? (item.allergiesCount / item.patientCount) * 100 : 0;

            return (
              <Card key={idx} className={chronicPct > 20 ? "border-warning/50" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{item.governorate}</CardTitle>
                    {chronicPct > 20 && (
                      <Badge tone="warning">{ar ? "معدل مرتفع" : "High Rate"}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ar ? "إجمالي المرضى المسجلين:" : "Total Registered Patients:"} <span className="font-semibold text-foreground">{item.patientCount}</span>
                  </p>
                </CardHeader>
                <CardContent className="space-y-5 mt-2">
                  
                  {/* Chronic Conditions */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-orange-600 dark:text-orange-400">
                        <HeartPulse className="w-4 h-4" /> {ar ? "أمراض مزمنة" : "Chronic Conditions"}
                      </span>
                      <span>{item.chronicConditionsCount} <span className="text-muted-foreground text-xs">({chronicPct.toFixed(1)}%)</span></span>
                    </div>
                    <Progress value={chronicPct} className="h-2 bg-orange-100 dark:bg-orange-950 [&>div]:bg-orange-500" />
                  </div>

                  {/* Allergies */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                        <AlertCircle className="w-4 h-4" /> {ar ? "حساسية مسجلة" : "Reported Allergies"}
                      </span>
                      <span>{item.allergiesCount} <span className="text-muted-foreground text-xs">({allergiesPct.toFixed(1)}%)</span></span>
                    </div>
                    <Progress value={allergiesPct} className="h-2 bg-blue-100 dark:bg-blue-950 [&>div]:bg-blue-500" />
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
