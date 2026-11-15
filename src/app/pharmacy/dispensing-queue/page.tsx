"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { PackageCheck, CheckCircle2, ShieldAlert, Package, ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api, rxCode } from "@/lib/data/service";
import type { Prescription } from "@/types/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { matchesPatientQuery, pick } from "@/lib/utils/format";

const TONE: Record<Prescription["status"], "warning" | "secondary" | "success" | "error" | "neutral"> = {
  draft: "neutral",
  signed: "warning",
  verified: "secondary",
  dispensed: "success",
  "partially-dispensed": "warning",
  rejected: "error",
};
const LABEL: Record<Prescription["status"], { en: string; ar: string }> = {
  draft: { en: "Draft", ar: "مسودة" },
  signed: { en: "Awaiting verification", ar: "بانتظار التحقق" },
  verified: { en: "Ready to dispense", ar: "جاهزة للصرف" },
  dispensed: { en: "Dispensed", ar: "تم الصرف" },
  "partially-dispensed": { en: "Partially dispensed", ar: "صرف جزئي" },
  rejected: { en: "Rejected", ar: "مرفوضة" },
};

export default function DispensingQueuePage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [items, setItems] = useState<Prescription[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"queue" | "history">("queue");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.getPrescriptions());
    } catch (e) {
      handleError(e);
    }
  }, [handleError]);
  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const base = items.filter((rx) =>
      tab === "queue"
        ? rx.status === "signed" || rx.status === "verified"
        : rx.status === "dispensed" || rx.status === "rejected"
    );
    return base.filter((rx) =>
      matchesPatientQuery(rx.patient, query, rxCode(rx), rx.id, rx.diagnosis.ar, rx.diagnosis.en)
    );
  }, [items, tab, query]);

  async function verifyRx(id: string) {
    setBusyId(id);
    try {
      await api.verifyRx(id);
      push("success", ar ? "تم التحقق من سلامة الروشتة وتجهيزها للصرف" : "Prescription verified and ready to dispense");
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusyId(null);
    }
  }

  async function dispense(id: string) {
    setBusyId(id);
    try {
      await api.dispenseRx(id);
      push(
        "success",
        ar
          ? "تم صرف الروشتة وخصم الرصيد من المخزن وإنشاء مطالبة التأمين الصحي الشامل"
          : "Prescription dispensed, stock deducted, and UHIA claim generated"
      );
      await load();
    } catch (e) {
      handleError(e);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const ready = items.filter((r) => r.status === "verified").length;
  const awaiting = items.filter((r) => r.status === "signed").length;
  const dispensed = items.filter((r) => r.status === "dispensed").length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={PackageCheck}
        title={ar ? "قائمة صرف الروشتات الموحدة" : "Dispensing queue"}
        badge={ar ? "تحقق فوري بالرقم القومي و MTI ثم صرف وخصم آلي من المخزن" : "Verify by National ID/MTI, then dispense"}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={ShieldAlert} label={ar ? "بانتظار التحقق" : "Awaiting verification"} value={awaiting} tone="warning" />
        <StatCard icon={Package} label={ar ? "جاهزة للصرف" : "Ready to dispense"} value={ready} tone="secondary" />
        <StatCard icon={CheckCircle2} label={ar ? "تم الصرف" : "Dispensed"} value={dispensed} tone="success" />
        <StatCard icon={PackageCheck} label={ar ? "الإجمالي" : "Total"} value={items.length} tone="primary" />
      </div>
      <Card>
        <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Tabs
            tabs={[
              { id: "queue", label: ar ? "القائمة" : "Queue", count: ready + awaiting },
              { id: "history", label: ar ? "السجل" : "History" },
            ]}
            active={tab}
            onChange={setTab}
          />
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={
              ar
                ? "ابحث بالاسم، الرقم القومي (14 رقم)، كود MTI، أو كود الروشتة..."
                : "Search by Name, 14-digit National ID, MTI, or Rx Code..."
            }
            className="w-full sm:w-96"
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              {ar ? "لا توجد روشتات مطابقة" : "No prescriptions"}
            </p>
          )}
          {filtered.map((rx) => (
            <div
              key={rx.id}
              className="flex flex-col gap-3 rounded-lg border border-outline-variant/40 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0">
                  <Image src={rx.patient.photoUrl} alt="" fill sizes="44px" className="rounded-lg object-cover" unoptimized />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-on-surface">{pick(rx.patient.fullName, locale)}</p>
                    <span className="font-mono text-xs font-bold text-secondary">#{rxCode(rx)}</span>
                    <span className="font-mono text-[11px] font-semibold text-primary">MTI: {rx.patient.mti}</span>
                    {rx.patient.nationalId && (
                      <span className="font-mono text-[11px] text-on-surface-variant">
                        {ar ? "الرقم القومي:" : "NID:"}{" "}
                        <strong className="text-on-surface">{rx.patient.nationalId}</strong>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {rx.medications.map((m) => `${pick(m.name, locale)} (${m.dose})`).join("، ")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 ps-14 sm:ps-0">
                <Badge tone={TONE[rx.status]}>{pick(LABEL[rx.status], locale)}</Badge>
                {rx.status === "signed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<ShieldCheck className="h-3.5 w-3.5" />}
                    loading={busyId === rx.id}
                    onClick={() => verifyRx(rx.id)}
                  >
                    {ar ? "تحقق فوري" : "Verify Rx"}
                  </Button>
                )}
                {rx.status === "verified" && (
                  <Button size="sm" loading={busyId === rx.id} onClick={() => dispense(rx.id)}>
                    {ar ? "صرف الآن" : "Dispense now"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
