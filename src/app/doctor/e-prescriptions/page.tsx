"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pill, Plus, Stethoscope } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api, patientId, rxCode } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
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

export default function DoctorPrescriptionsPage() {
  const { locale } = useLocale();
  const handleError = useApiError();
  const router = useRouter();
  const ar = locale === "ar";
  const [items, setItems] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Prescription | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.getPrescriptions();
      setItems(res);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError]);
  useEffect(() => {
    void load();
  }, [load]);

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
            <Button
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
          </div>
        )}
      </Modal>
    </div>
  );
}
