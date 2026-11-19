"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

/* eslint-disable @typescript-eslint/no-explicit-any */
const TITLES = {
  HOSPITAL: {
    en: "Incoming Clinical Referrals to Hospital",
    ar: "الإحالات الطبية الواردة للمستشفى من العيادات",
  },
  LAB: {
    en: "Incoming Lab Referrals from Physicians",
    ar: "إحالات التحاليل الواردة للمعمل من الأطباء",
  },
  PHARMACY: {
    en: "Incoming Pharmacy Referrals",
    ar: "إحالات الصيدلية الواردة من الأطباء",
  },
} as const;

export function IncomingReferralsCard({
  targetType,
  referrals,
  onUpdated,
}: {
  targetType: "HOSPITAL" | "LAB" | "PHARMACY";
  referrals: any[];
  onUpdated: () => Promise<void> | void;
}) {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [busyId, setBusyId] = useState<string | null>(null);

  const active = referrals.filter(
    (r) =>
      (r.targetType === targetType || r.target === targetType) &&
      (r.status === "PENDING" || r.status === "ACCEPTED")
  );

  if (active.length === 0) return null;

  async function act(id: string, status: "ACCEPTED" | "COMPLETED") {
    setBusyId(id);
    try {
      await api.actOnReferral(
        id,
        status,
        status === "ACCEPTED" ? "Accepted by receiving facility" : "Completed by receiving facility",
        status === "ACCEPTED" ? "تم قبول الإحالة بالمنشأة المستقبلة" : "تم إتمام تنفيذ الإحالة الطبية"
      );
      push(
        "success",
        status === "ACCEPTED"
          ? (ar ? "تم قبول الإحالة وإشعار الطبيب والمواطن" : "Referral accepted & physician/citizen notified")
          : (ar ? "تم إتمام الإحالة بنجاح" : "Referral marked completed")
      );
      await onUpdated();
    } catch (e) {
      handleError(e);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-primary">
          <Send className="h-4 w-4" />
          {TITLES[targetType][locale]} ({active.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {active.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-0.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-on-surface">
                  {r.patient ? (ar ? r.patient.fullNameAr : r.patient.fullNameEn) : "—"}
                </span>
                {r.patient?.mti && (
                  <span className="font-mono text-[11px] font-semibold text-primary">
                    MTI: {r.patient.mti}
                  </span>
                )}
                <Badge tone={r.urgency === "CRITICAL" ? "error" : "secondary"}>
                  {r.urgency}
                </Badge>
                <Badge tone={r.status === "ACCEPTED" ? "success" : "warning"}>
                  {r.status}
                </Badge>
              </div>
              <p className="font-semibold text-on-surface">
                {targetType === "HOSPITAL"
                  ? (ar ? r.departmentAr : r.departmentEn)
                  : targetType === "LAB"
                    ? r.testPanel
                    : (ar ? r.medicationAr : r.medicationEn) || (ar ? r.reasonAr : r.reasonEn)}
              </p>
              <p className="text-on-surface-variant">
                {ar ? r.reasonAr || r.clinicalNoteAr : r.reasonEn || r.clinicalNoteEn}
                {r.sender && (
                  <>
                    {" "}
                    • {ar ? "من:" : "From:"}{" "}
                    <strong>{ar ? r.sender.fullNameAr : r.sender.fullNameEn}</strong>
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {r.status === "PENDING" && (
                <Button
                  size="sm"
                  variant="outline"
                  loading={busyId === r.id}
                  onClick={() => void act(r.id, "ACCEPTED")}
                >
                  {ar ? "قبول الإحالة" : "Accept"}
                </Button>
              )}
              <Button
                size="sm"
                loading={busyId === r.id}
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => void act(r.id, "COMPLETED")}
              >
                {ar ? "إتمام" : "Complete"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
