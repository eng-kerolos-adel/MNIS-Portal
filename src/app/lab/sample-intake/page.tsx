"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { TestTubes, Clock, CheckCircle2, Truck, FlaskConical, XCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import type { LabSample } from "@/types/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { pick, formatTime, matchesPatientQuery } from "@/lib/utils/format";

/** Same forward-only path the API enforces; results entry/verification live on the next screen. */
const NEXT: Partial<Record<LabSample["status"], LabSample["status"]>> = {
  "awaiting-collection": "in-transit",
  "in-transit": "received",
  received: "processing",
};
const LABEL: Record<LabSample["status"], { en: string; ar: string }> = {
  "awaiting-collection": { en: "Awaiting collection", ar: "بانتظار السحب" },
  "in-transit": { en: "In transit", ar: "في الطريق للمعمل" },
  received: { en: "Received", ar: "تم الاستلام" },
  processing: { en: "Processing", ar: "قيد التحليل" },
  "results-entered": { en: "Awaiting verification", ar: "بانتظار الاعتماد" },
  verified: { en: "Verified", ar: "معتمدة" },
  rejected: { en: "Rejected", ar: "مرفوضة" },
};
const TONE: Record<LabSample["status"], "neutral" | "secondary" | "warning" | "success" | "error"> = {
  "awaiting-collection": "neutral",
  "in-transit": "secondary",
  received: "warning",
  processing: "warning",
  "results-entered": "secondary",
  verified: "success",
  rejected: "error",
};
const PRIORITY_TONE: Record<LabSample["priority"], "neutral" | "warning" | "error"> = {
  routine: "neutral",
  urgent: "warning",
  stat: "error",
};

export default function SampleIntakePage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [samples, setSamples] = useState<LabSample[]>([]);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSamples(await api.getLabSamples());
    } catch (e) {
      handleError(e);
    }
  }, [handleError]);
  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return samples.filter((s) =>
      matchesPatientQuery(
        s.patient,
        query,
        s.barcode,
        s.testPanel.ar,
        s.testPanel.en
      )
    );
  }, [samples, query]);

  async function move(id: string, status: LabSample["status"]) {
    setBusyId(id);
    try {
      await api.setSampleStatus(
        id,
        status,
        status === "rejected" ? (ar ? "مرفوضة من المعمل" : "Rejected by lab") : undefined
      );
      push(
        status === "rejected" ? "info" : "success",
        ar ? "تم تحديث حالة العينة" : "Sample status updated"
      );
      await load();
    } catch (e) {
      handleError(e);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader icon={TestTubes} title={ar ? "استلام العينات وقائمة المعمل" : "Sample intake & lab queue"} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Truck}
          label={ar ? "قيد الاستلام" : "In progress"}
          value={samples.filter((s) => ["received", "processing"].includes(s.status)).length}
          tone="warning"
        />
        <StatCard
          icon={Clock}
          label={ar ? "عاجلة (STAT)" : "STAT"}
          value={samples.filter((s) => s.priority === "stat" && !["verified", "rejected"].includes(s.status)).length}
          tone="error"
        />
        <StatCard
          icon={CheckCircle2}
          label={ar ? "معتمدة" : "Verified"}
          value={samples.filter((s) => s.status === "verified").length}
          tone="success"
        />
        <StatCard icon={FlaskConical} label={ar ? "الإجمالي" : "Total"} value={samples.length} tone="secondary" />
      </div>
      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <CardTitle>{ar ? "العينات المسجلة" : "Samples"}</CardTitle>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={
              ar
                ? "ابحث بالاسم، الرقم القومي (14 رقم)، كود MTI، أو الباركود..."
                : "Search by Name, 14-digit National ID, MTI, or Barcode..."
            }
            className="w-full sm:w-96"
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              {ar ? "لا توجد عينات مطابقة" : "No samples"}
            </p>
          )}
          {filtered.map((s) => {
            const next = NEXT[s.status];
            const open = !["verified", "rejected", "results-entered"].includes(s.status);
            return (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-lg border border-outline-variant/40 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0">
                    <Image src={s.patient.photoUrl} alt="" fill sizes="44px" className="rounded-lg object-cover" unoptimized />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-on-surface">{pick(s.patient.fullName, locale)}</p>
                      <span className="font-mono text-xs font-bold text-secondary">{s.barcode}</span>
                      <span className="font-mono text-[11px] font-semibold text-primary">MTI: {s.patient.mti}</span>
                      {s.patient.nationalId && (
                        <span className="font-mono text-[11px] text-on-surface-variant">
                          {ar ? "الرقم القومي:" : "NID:"}{" "}
                          <strong className="text-on-surface">{s.patient.nationalId}</strong>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {pick(s.testPanel, locale)} • {pick(s.sampleType, locale)} • {formatTime(s.collectedAt, locale)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 ps-14 sm:ps-0">
                  <Badge tone={PRIORITY_TONE[s.priority]}>{s.priority.toUpperCase()}</Badge>
                  <Badge tone={TONE[s.status]}>{pick(LABEL[s.status], locale)}</Badge>
                  {next && (
                    <Button size="sm" variant="outline" loading={busyId === s.id} onClick={() => move(s.id, next)}>
                      {ar ? "الحالة التالية" : "Advance"}
                    </Button>
                  )}
                  {s.status === "processing" && (
                    <span className="text-xs text-on-surface-variant">
                      {ar ? "أدخل النتائج من شاشة النتائج" : "Enter results on the Results screen"}
                    </span>
                  )}
                  {open && (
                    <button
                      onClick={() => move(s.id, "rejected")}
                      className="rounded-lg p-2 text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                      aria-label="reject"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
