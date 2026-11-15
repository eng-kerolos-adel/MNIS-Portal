"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldAlert, AlertTriangle, Users, Repeat } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { pick } from "@/lib/utils/format";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function FraudDetectionPage() {
  const { locale } = useLocale();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.getAnalyticsFraud();
      setData(res);
    } catch (e) { handleError(e); } finally { setLoading(false); }
  }, [handleError]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader icon={ShieldAlert} title={ar ? "نظام كشف التلاعب" : "Fraud Detection"} badge={ar ? "ذكاء اصطناعي" : "AI-Powered"} />
      
      {loading && <p className="text-sm text-center py-8 text-on-surface-variant">Loading...</p>}
      
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Repeat className="h-5 w-5 text-warning" />
              <CardTitle>{ar ? "تكرار الصرف المريب" : "Suspicious Repeated Dispensing"}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.repeatedDispensing?.length === 0 ? (
                <p className="text-sm text-on-surface-variant">{ar ? "لا يوجد نشاط مريب" : "No suspicious activity detected."}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.repeatedDispensing?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between p-3 rounded-lg bg-surface-container-low text-sm">
                      <span className="font-semibold">{pick({en: item.nameEn, ar: item.nameAr}, locale) || item.nameEn}</span>
                      <span className="text-error font-bold">{item._count?._all || item.count} {ar ? "مرة" : "times"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Users className="h-5 w-5 text-error" />
              <CardTitle>{ar ? "صرف من أطباء متعددين (Doctor Shopping)" : "Multi-Doctor Prescriptions"}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.multiDoctorPrescriptions?.length === 0 ? (
                <p className="text-sm text-on-surface-variant">{ar ? "لا يوجد نشاط مريب" : "No suspicious activity detected."}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.multiDoctorPrescriptions?.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-surface-container-low text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold">{ar ? "رقم المريض" : "Patient ID"}: {item.patientId}</span>
                        <span className="text-error font-bold">{item.doctorCount} {ar ? "أطباء مختلفين" : "doctors"}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">{item.rxCount} {ar ? "روشتات خلال 14 يوم" : "prescriptions in 14 days"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-error" />
              <CardTitle>{ar ? "تجديد الروشتات المبكر جداً" : "Abnormally Rapid Refills"}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.rapidRefills?.length === 0 ? (
                <p className="text-sm text-on-surface-variant">{ar ? "لا يوجد نشاط مريب" : "No suspicious activity detected."}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.rapidRefills?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between p-3 rounded-lg bg-surface-container-low text-sm">
                      <span className="font-semibold">{ar ? "طلب تجديد" : "Renewal Request"}: {item.id}</span>
                      <span className="text-error font-bold">{ar ? "خلال 7 أيام" : "Within 7 days"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
