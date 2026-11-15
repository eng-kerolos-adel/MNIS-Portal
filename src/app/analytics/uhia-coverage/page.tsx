"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, CheckCircle2, MapPin } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function UhiaCoveragePage() {
  const { locale, dir } = useLocale();
  const ar = locale === "ar";
  const handleError = useApiError();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsUhia();
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

  const breakdown = data?.breakdown || [];

  return (
    <div className="space-y-6" dir={dir}>
      <PageHeader
        title={ar ? "التغطية التأمينية الشاملة (UHIA)" : "UHIA Coverage"}
        meta={ar ? "تقارير ونسب تغطية منظومة التأمين الصحي الشامل حسب المحافظات." : "Reports and coverage percentages of the Universal Health Insurance by governorates."}
        icon={ShieldCheck}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Overall Coverage */}
        <Card className="md:col-span-3 bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary text-primary-foreground rounded-full">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{ar ? "إجمالي التغطية التأمينية (الجمهورية)" : "Overall National Coverage"}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-4xl font-bold text-primary">{(data?.overallCoveragePct || 0).toFixed(1)}%</h3>
                  <span className="text-sm text-muted-foreground">
                    ({data?.overallInsured?.toLocaleString()} {ar ? "من" : "of"} {data?.overallTotal?.toLocaleString()} {ar ? "مواطن مسجل" : "registered citizens"})
                  </span>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/3">
              <div className="flex justify-between text-sm mb-2">
                <span>{ar ? "مؤمن عليه" : "Insured"}</span>
                <span>{ar ? "غير مؤمن" : "Uninsured"}</span>
              </div>
              <Progress value={data?.overallCoveragePct || 0} className="h-3 [&>div]:bg-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Governorates Breakdown */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              {ar ? "التغطية حسب المحافظة" : "Coverage by Governorate"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {ar ? "لا توجد بيانات مسجلة للمحافظات بعد." : "No governorate data recorded yet."}
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {breakdown.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-3 p-4 border rounded-lg bg-card">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-lg">{item.governorate}</h4>
                      {item.coveragePct >= 80 && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{item.coveragePct.toFixed(1)}%</span>
                        <span className="text-muted-foreground text-xs">
                          {item.insured} / {item.total}
                        </span>
                      </div>
                      <Progress 
                        value={item.coveragePct} 
                        className={`h-2 ${item.coveragePct >= 80 ? '[&>div]:bg-emerald-500' : ''}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
