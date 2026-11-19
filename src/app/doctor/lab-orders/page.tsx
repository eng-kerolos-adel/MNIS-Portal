"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { FlaskConical, Plus, Eye, Printer } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api, patientId } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { OfficialPrintModal } from "@/components/ui/OfficialPrintModal";
import { SearchInput } from "@/components/ui/SearchInput";
import { pick, formatDate, matchesPatientQuery } from "@/lib/utils/format";
import type { LabSample, NationalIdentity } from "@/types/domain";

const TONE: Record<string, "neutral" | "primary" | "success" | "warning" | "error" | "secondary"> = {
  "awaiting-collection": "neutral",
  "in-transit": "secondary",
  received: "warning",
  processing: "warning",
  "results-entered": "secondary",
  verified: "success",
  rejected: "error",
};

export default function DoctorLabOrdersPage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [items, setItems] = useState<LabSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedSample, setSelectedSample] = useState<LabSample | null>(null);
  const [printSample, setPrintSample] = useState<LabSample | null>(null);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [citizenSearch, setCitizenSearch] = useState("");
  const [citizens, setCitizens] = useState<NationalIdentity[]>([]);
  const [labs, setLabs] = useState<{ id: string; nameEn: string; nameAr: string }[]>([]);
  const [targetLabId, setTargetLabId] = useState("");
  const [selectedCitizen, setSelectedCitizen] = useState<NationalIdentity | null>(null);
  const [panel, setPanel] = useState("Complete Blood Count (CBC)");
  const [priority, setPriority] = useState<"ROUTINE" | "URGENT" | "STAT">("URGENT");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [res, labList] = await Promise.all([api.getLabSamples(), api.getLabs().catch(() => [])]);
      setItems(res);
      setLabs(labList);
      if (labList.length > 0) setTargetLabId((cur) => cur || labList[0]!.id);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError]);
  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!orderModalOpen) return;
    api
      .searchPatients(citizenSearch.trim())
      .then((res) => {
        setCitizens(res);
        if (!selectedCitizen && res[0]) setSelectedCitizen(res[0]);
      })
      .catch(() => {});
  }, [orderModalOpen, citizenSearch, selectedCitizen]);

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        matchesPatientQuery(
          i.patient,
          query,
          i.barcode,
          i.testPanel.ar,
          i.testPanel.en
        )
      ),
    [items, query]
  );

  async function submitNewOrder() {
    if (!selectedCitizen) return;
    const chosenLab = labs.find((l) => l.id === targetLabId);
    setBusy(true);
    try {
      await api.orderLabSample({
        patientId: patientId(selectedCitizen),
        panelEn: panel,
        panelAr: panel,
        sampleTypeEn: "Venous Blood",
        sampleTypeAr: "عينة دم وريدي",
        priority,
        targetLabUserId: targetLabId || undefined,
      });
      push(
        "success",
        ar
          ? `تم إرسال طلب التحليل إلى (${chosenLab?.nameAr || "المعمل المختار"}) فوراً`
          : `Lab sample order sent to ${chosenLab?.nameEn || "Selected Lab"}`
      );
      setOrderModalOpen(false);
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={FlaskConical}
        title={ar ? "طلبات ونتائج المعمل المركزي" : "Lab Orders & Verified Results"}
        actions={
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setOrderModalOpen(true)}
          >
            {ar ? "طلب تحليل معملي جديد" : "Order New Lab Test"}
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <CardTitle>{ar ? "سجل التحاليل ونتائج الفحص" : "Orders & Results History"}</CardTitle>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={
              ar
                ? "ابحث بالاسم، الرقم القومي (14 رقم)، كود MTI، أو باركود العينة..."
                : "Search by Name, 14-digit National ID, MTI, or Sample Barcode..."
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
              {ar ? "لا توجد طلبات مطابقة" : "No lab orders found"}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {filtered.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedSample(r)}
                className="flex cursor-pointer flex-col gap-2 p-3 border border-outline-variant/40 rounded-lg bg-surface-container-lowest sm:flex-row sm:items-center sm:justify-between hover:bg-surface-container-low transition-colors"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-sm text-on-surface">
                      {pick(r.patient.fullName, locale)}
                    </p>
                    <span className="text-xs font-mono bg-surface-container px-1.5 py-0.5 rounded text-secondary font-bold">
                      {r.barcode}
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
                    {pick(r.testPanel, locale)} • {pick(r.sampleType, locale)}
                  </p>
                  <p className="text-xs text-on-surface-variant/70">
                    {formatDate(r.collectedAt, locale)}
                    {(r.orderedBy.en || r.orderedBy.ar) && (
                      <> • {ar ? "طلب:" : "Ordered by:"} {pick(r.orderedBy, locale)}</>
                    )}
                    {r.facility && (r.facility.en || r.facility.ar) && (
                      <> • <strong className="text-primary">{pick(r.facility, locale)}</strong></>
                    )}
                    {r.results && r.results.length > 0
                      ? ` • ${r.results.length} ${ar ? "مؤشرات معملية مرصودة" : "analytes recorded"}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={r.priority === "stat" ? "error" : r.priority === "urgent" ? "warning" : "neutral"}>
                    {r.priority.toUpperCase()}
                  </Badge>
                  <Badge tone={TONE[r.status] || "neutral"}>
                    {r.status.replace(/-/g, " ").toUpperCase()}
                  </Badge>
                  <Button size="sm" variant="outline" icon={<Eye className="h-3.5 w-3.5" />}>
                    {ar ? "النتائج" : "Results"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sample Results Modal */}
      <Modal
        open={!!selectedSample}
        onClose={() => setSelectedSample(null)}
        title={
          selectedSample
            ? `${pick(selectedSample.testPanel, locale)} — ${selectedSample.barcode}`
            : ""
        }
      >
        {selectedSample && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-surface-container-low p-3 text-xs space-y-1">
              <p className="text-sm font-bold text-primary">
                {pick(selectedSample.patient.fullName, locale)}
              </p>
              <p className="font-mono">
                MTI: <strong>{selectedSample.patient.mti}</strong>
                {selectedSample.patient.nationalId
                  ? ` • ${ar ? "الرقم القومي:" : "NID:"} ${selectedSample.patient.nationalId}`
                  : ""}
              </p>
              <p>
                {ar ? "نوع العينة:" : "Sample Type:"}{" "}
                <strong>{pick(selectedSample.sampleType, locale)}</strong>
                {(selectedSample.orderedBy.en || selectedSample.orderedBy.ar) && (
                  <> • {ar ? "طلب:" : "Ordered by:"} <strong>{pick(selectedSample.orderedBy, locale)}</strong></>
                )}
                {selectedSample.verifiedBy && (
                  <> • {ar ? "اعتماد:" : "Verified by:"} <strong>{pick(selectedSample.verifiedBy, locale)}</strong></>
                )}
              </p>
            </div>

            {selectedSample.results && selectedSample.results.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-outline-variant/40">
                <table className="w-full text-xs text-start">
                  <thead className="bg-surface-container text-on-surface-variant">
                    <tr>
                      <th className="p-2 text-start">{ar ? "المؤشر" : "Analyte"}</th>
                      <th className="p-2 text-start">{ar ? "القيمة" : "Value"}</th>
                      <th className="p-2 text-start">{ar ? "المدى المرجعي" : "Reference"}</th>
                      <th className="p-2 text-start">{ar ? "التقييم" : "Flag"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {selectedSample.results.map((row) => (
                      <tr key={row.id}>
                        <td className="p-2 font-semibold">{pick(row.analyte, locale)}</td>
                        <td className="p-2 font-mono font-bold">
                          {row.value} {row.unit}
                        </td>
                        <td className="p-2 font-mono text-on-surface-variant">
                          {row.refLow} – {row.refHigh} {row.unit}
                        </td>
                        <td className="p-2">
                          <Badge
                            tone={
                              row.flag === "normal"
                                ? "success"
                                : row.flag === "critical"
                                ? "error"
                                : "warning"
                            }
                          >
                            {row.flag.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-on-surface-variant">
                {ar
                  ? "العينة قيد الفحص بالمعمل المركزي ولم تُعتمد القيم الرقمية بعد."
                  : "Sample is currently in laboratory processing; numeric rows pending."}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                variant="outline"
                icon={<Printer className="h-4 w-4" />}
                onClick={() => setPrintSample(selectedSample)}
              >
                {ar ? "طباعة التقرير المعملي الرسمي بـ QR" : "Print Official Lab Report"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <OfficialPrintModal sample={printSample} onClose={() => setPrintSample(null)} />

      {/* Order New Lab Sample Modal */}
      <Modal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title={ar ? "طلب تحليل معملي جديد لمواطن" : "Order New Lab Test"}
      >
        <div className="flex flex-col gap-3">
          <SearchInput
            value={citizenSearch}
            onChange={setCitizenSearch}
            placeholder={
              ar
                ? "ابحث بالاسم أو الرقم القومي أو كود MTI..."
                : "Search citizen by Name, National ID, or MTI..."
            }
          />
          <div className="max-h-40 overflow-y-auto rounded-lg border border-outline-variant/40 divide-y divide-outline-variant/20">
            {citizens.map((c) => {
              const cid = patientId(c);
              const isSel = selectedCitizen && patientId(selectedCitizen) === cid;
              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => setSelectedCitizen(c)}
                  className={`w-full flex items-center justify-between p-2.5 text-start text-xs ${
                    isSel
                      ? "bg-primary-container text-on-primary-container font-bold"
                      : "hover:bg-surface-container-low"
                  }`}
                >
                  <div>
                    <p className="font-bold">{pick(c.fullName, locale)}</p>
                    <p className="font-mono text-[11px] opacity-80">
                      MTI: {c.mti} {c.nationalId ? `• NID: ${c.nationalId}` : ""}
                    </p>
                  </div>
                  <Badge tone="secondary">{c.bloodType}</Badge>
                </button>
              );
            })}
          </div>
          <select
            className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none"
            value={panel}
            onChange={(e) => setPanel(e.target.value)}
          >
            <option value="Complete Blood Count (CBC)">
              Complete Blood Count (CBC) — صورة دم كاملة
            </option>
            <option value="HbA1c & Fasting Glucose">
              HbA1c & Fasting Glucose — سكر تراكمي وصائم
            </option>
            <option value="Comprehensive Metabolic Panel">
              Comprehensive Metabolic Panel — وظائف كبد وكلى
            </option>
            <option value="Lipid Profile">Lipid Profile — دهون الدم</option>
            <option value="Cardiac Troponin-I (STAT)">
              Cardiac Troponin-I (STAT) — إنزيمات قلب طارئة
            </option>
          </select>
          {labs.length > 0 && (
            <select
              className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none"
              value={targetLabId}
              onChange={(e) => setTargetLabId(e.target.value)}
            >
              {labs.map((l) => (
                <option key={l.id} value={l.id}>
                  {ar ? `المعمل: ${l.nameAr}` : `Lab: ${l.nameEn}`}
                </option>
              ))}
            </select>
          )}
          <select
            className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none"
            value={priority}
            onChange={(e) => setPriority(e.target.value as "ROUTINE" | "URGENT" | "STAT")}
          >
            <option value="ROUTINE">{ar ? "اعتيادي (ROUTINE)" : "ROUTINE"}</option>
            <option value="URGENT">{ar ? "عاجل (URGENT)" : "URGENT"}</option>
            <option value="STAT">{ar ? "طوارئ قصوى (STAT)" : "STAT"}</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOrderModalOpen(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button loading={busy} disabled={!selectedCitizen} onClick={submitNewOrder}>
              {ar ? "إرسال الطلب للمعمل" : "Submit Lab Order"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
