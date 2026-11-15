"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldAlert, AlertTriangle, UserX, RefreshCcw } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function FraudDetectionPage() {
  const { locale, dir } = useLocale();
  const ar = locale === "ar";
  const handleError = useApiError();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsFraud();
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
        title={ar ? "كشف الاحتيال والمخالفات" : "Fraud & Abuse Detection"}
        meta={ar ? "مراقبة الأنماط غير الطبيعية في صرف الأدوية وزيارات الأطباء." : "Monitor abnormal patterns in drug dispensing and doctor visits."}
        icon={ShieldAlert}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Rapid Refills */}
        <Card className="border-warning/50 shadow-sm">
          <CardHeader className="bg-warning/10 pb-4">
            <div className="flex items-center gap-2 text-warning-foreground">
              <RefreshCcw className="w-5 h-5" />
              <CardTitle className="text-lg">
                {ar ? "تجديد مبكر للوصفات" : "Rapid Refills"}
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {ar ? "وصفات تم تجديدها خلال 7 أيام من الإصدار" : "Prescriptions renewed within 7 days of issuance"}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {data?.rapidRefills?.length > 0 ? (
              <div className="space-y-3">
                {data.rapidRefills.map((r: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                    <span className="font-mono text-muted-foreground">{r.patientId.slice(0, 8)}...</span>
                    <Badge tone="warning">{ar ? "تجديد مشبوه" : "Suspicious Refill"}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">{ar ? "لا يوجد أنماط مشبوهة" : "No suspicious patterns"}</p>
            )}
          </CardContent>
        </Card>

        {/* Multi-Doctor Prescriptions */}
        <Card className="border-destructive/50 shadow-sm">
          <CardHeader className="bg-destructive/10 pb-4">
            <div className="flex items-center gap-2 text-destructive">
              <UserX className="w-5 h-5" />
              <CardTitle className="text-lg">
                {ar ? "تعدد الأطباء (Doctor Shopping)" : "Doctor Shopping"}
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {ar ? "مرضى حصلوا على أكثر من 3 وصفات من أطباء مختلفين خلال 14 يوم" : "Patients with >3 prescriptions from different doctors in 14 days"}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {data?.multiDoctorPrescriptions?.length > 0 ? (
              <div className="space-y-3">
                {data.multiDoctorPrescriptions.map((p: any, idx: number) => (
                  <div key={idx} className="flex flex-col text-sm border-b pb-2 last:border-0">
                    <div className="flex justify-between items-center">
                      <span className="font-mono">{p.patientId.slice(0,8)}...</span>
                      <span className="font-bold text-destructive">{p.rxCount} {ar ? "وصفات" : "Rx"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">{ar ? "من" : "from"} {p.uniqueDoctors} {ar ? "أطباء مختلفين" : "different doctors"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">{ar ? "لا يوجد أنماط مشبوهة" : "No suspicious patterns"}</p>
            )}
          </CardContent>
        </Card>

        {/* Repeated Dispensing */}
        <Card className="border-info/50 shadow-sm">
          <CardHeader className="bg-info/10 pb-4">
            <div className="flex items-center gap-2 text-info-foreground">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle className="text-lg">
                {ar ? "صرف متكرر" : "Repeated Dispensing"}
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {ar ? "أدوية تم صرفها أكثر من 10 مرات في آخر 30 يوم" : "Medications dispensed >10 times in last 30 days"}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {data?.repeatedDispensing?.length > 0 ? (
              <div className="space-y-3">
                {data.repeatedDispensing.map((d: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                    <span className="font-medium truncate max-w-[150px]">{d.nameEn}</span>
                    <Badge tone="secondary">{d.count} {ar ? "مرة" : "times"}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">{ar ? "لا يوجد أنماط مشبوهة" : "No suspicious patterns"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
