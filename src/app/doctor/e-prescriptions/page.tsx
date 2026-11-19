"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pill, Plus, Printer, RefreshCw, Stethoscope, XCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api, patientId, rxCode } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { OfficialPrintModal } from "@/components/ui/OfficialPrintModal";
import { SearchInput } from "@/components/ui/SearchInput";
import { pick, formatDate, matchesPatientQuery } from "@/lib/utils/format";
import type { Prescription } from "@/types/domain";

const TONE: Record<string, "neutral" | "primary" | "success" | "warning" | "error" | "secondary"> = {
  draft: "neutral",
  signed: "warning",
  verified: "secondary",
  dispensed: "success",
  rejected: "error",
};

type RenewalItem = Awaited<ReturnType<typeof api.getRenewals>>[number];

export default function DoctorPrescriptionsPage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const router = useRouter();
  const ar = locale === "ar";
  const [items, setItems] = useState<Prescription[]>([]);
  const [renewals, setRenewals] = useState<RenewalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [printRx, setPrintRx] = useState<Prescription | null>(null);
  const [busyRenewalId, setBusyRenewalId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [res, ren] = await Promise.all([
        api.getPrescriptions(),
        api.getRenewals().catch(() => []),
      ]);
      setItems(res);
      setRenewals(ren);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError]);
  useEffect(() => {
    void load();
  }, [load]);

  async function handleApproveRenewal(id: string) {
    setBusyRenewalId(id);
    try {
      const res = await api.approveRenewal(id);
      push("success", ar ? "تم اعتماد وتوقيع تجديد الروشتة وإرسالها للصيدلية وإشعار المواطن" : "Renewal approved, digitally signed & sent to pharmacy", res.draftPrescriptionId.slice(0, 8).toUpperCase());
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusyRenewalId(null);
    }
  }

  async function handleRejectRenewal(id: string) {
    setBusyRenewalId(id);
    try {
      await api.rejectRenewal(id);
      push("info", ar ? "تم رفض طلب التجديد وإشعار المواطن" : "Renewal request rejected");
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusyRenewalId(null);
    }
  }

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        matchesPatientQuery(
          i.patient,
          query,
          i.id,
          rxCode(i),
          i.diagnosis.ar,
          i.diagnosis.en
        )
      ),
    [items, query]
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Pill}
        title={ar ? "الروشتات الإلكترونية والربط الصيدلي" : "E-Prescriptions & Pharmacy Link"}
        actions={
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => router.push("/doctor/consultation")}
          >
            {ar ? "كتابة روشتة إلكترونية جديدة" : "Write New E-Prescription"}
          </Button>
        }
      />

      {renewals.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
              <RefreshCw className="h-4 w-4" />
              {ar ? `طلبات تجديد الروشتات من تطبيق المواطن (${renewals.length})` : `Citizen Prescription Renewal Requests (${renewals.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {renewals.map((r) => (
              <div key={r.id} className="flex flex-col justify-between gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-sm text-on-surface">{pick(r.patient.fullName, locale)}</span>
                    <span className="font-mono text-[11px] font-semibold text-primary">MTI: {r.patient.mti}</span>
                  </div>
                  {r.prescription && (
                    <>
                      <p className="mt-1 font-semibold text-on-surface">
                        {pick(r.prescription.diagnosis, locale)}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        {r.prescription.medications.map((m) => `${pick(m.name, locale)} (${m.dose})`).join("، ")}
                      </p>
                    </>
                  )}
                  <p className="text-[10px] text-on-surface-variant/80 mt-1">
                    {ar ? "تاريخ الطلب:" : "Requested:"} {formatDate(r.createdAt, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    loading={busyRenewalId === r.id}
                    icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    onClick={() => handleApproveRenewal(r.id)}
                  >
                    {ar ? "موافقة وتوقيع وإرسال للصيدلية" : "Approve, Sign & Send"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyRenewalId === r.id}
                    icon={<XCircle className="h-3.5 w-3.5" />}
                    onClick={() => handleRejectRenewal(r.id)}
                  >
                    {ar ? "رفض" : "Reject"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <CardTitle>{ar ? "سجل الروشتات الموحد" : "Unified Prescription History"}</CardTitle>
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
        <CardContent>
          {loading && (
            <p className="text-sm text-center py-4 text-on-surface-variant">
              {ar ? "جاري التحميل..." : "Loading..."}
            </p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-center py-4 text-on-surface-variant">
              {ar ? "لا توجد روشتات مطابقة" : "No prescriptions found"}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="flex flex-col gap-2 p-3 border border-outline-variant/40 rounded-lg bg-surface-container-lowest sm:flex-row sm:items-center sm:justify-between text-start hover:bg-surface-container-low transition-colors"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-sm text-on-surface">
                      {pick(r.patient.fullName, locale)}
                    </p>
                    <span className="font-mono text-xs font-bold text-secondary">
                      #{rxCode(r)}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-primary">
                      MTI: {r.patient.mti}
                    </span>
                    {r.patient.nationalId && (
                      <span className="font-mono text-[11px] text-on-surface-variant">
                        {ar ? "الرقم القومي:" : "NID:"}{" "}
                        <strong className="text-on-surface">{r.patient.nationalId}</strong>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {pick(r.diagnosis, locale)} {r.icd10 ? `(${r.icd10})` : ""}
                  </p>
                  <p className="text-xs text-on-surface-variant/70">
                    {formatDate(r.createdAt, locale)} • {r.medications.length}{" "}
                    {ar ? "أدوية" : "items"}
                    {(r.physician.en || r.physician.ar) && (
                      <> • {ar ? "الطبيب:" : "Dr."} {pick(r.physician, locale)}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={TONE[r.status] || "neutral"}>
                    {r.status.toUpperCase()}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={ar ? "تفاصيل الروشتة الإلكترونية" : "Prescription Details"}
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-surface-container-low p-3 text-sm space-y-1">
              <p className="font-bold text-primary">
                {pick(selected.patient.fullName, locale)}
              </p>
              <p className="font-mono text-xs text-on-surface-variant">
                MTI: <strong className="text-on-surface">{selected.patient.mti}</strong>
                {selected.patient.nationalId
                  ? ` • ${ar ? "الرقم القومي:" : "NID:"} ${selected.patient.nationalId}`
                  : ""}
              </p>
              <p className="font-semibold text-on-surface pt-1">
                {pick(selected.diagnosis, locale)}
              </p>
              <p className="text-xs font-mono text-on-surface-variant">
                {ar ? "كود الروشتة:" : "Rx Code:"} #{rxCode(selected)} ({selected.id})
              </p>
            </div>
            <div>
              <p className="font-bold text-sm mb-2">
                {ar ? "الأدوية الموصوفة" : "Medications"}
              </p>
              <div className="flex flex-col gap-2">
                {selected.medications.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 border border-outline-variant/40 rounded-md bg-surface-container-lowest"
                  >
                    <p className="text-sm font-bold">{pick(m.name, locale)}</p>
                    <p className="text-xs text-on-surface-variant">
                      {m.dose} • {pick(m.frequency, locale)} • {m.durationDays}{" "}
                      {ar ? "يوم" : "days"} • ×{m.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="flex-1"
                icon={<Stethoscope className="h-4 w-4" />}
                onClick={() => {
                  const pid = patientId(selected.patient);
                  setSelected(null);
                  router.push(`/doctor/consultation?patientId=${encodeURIComponent(pid)}`);
                }}
              >
                {ar
                  ? "فتح غرفة الكشف لهذا المريض"
                  : "Open Consultation for this Patient"}
              </Button>
              <Button
                variant="outline"
                icon={<Printer className="h-4 w-4" />}
                onClick={() => setPrintRx(selected)}
              >
                {ar ? "طباعة الروشتة بـ QR" : "Print QR Rx"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <OfficialPrintModal rx={printRx} onClose={() => setPrintRx(null)} />
    </div>
  );
}
