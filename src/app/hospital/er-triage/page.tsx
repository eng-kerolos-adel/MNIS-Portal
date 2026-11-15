"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Siren, HeartPulse, Thermometer, Activity, Wind, Ambulance, Clock } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import type { AcuityLevel, Bed, ERCase } from "@/types/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { pick, formatTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const ACUITY_TONE: Record<AcuityLevel, "error" | "warning" | "secondary" | "success"> = { 1: "error", 2: "error", 3: "warning", 4: "secondary", 5: "success" };
const ACUITY_LABEL: Record<AcuityLevel, { en: string; ar: string }> = {
  1: { en: "Resuscitation", ar: "إنعاش فوري" }, 2: { en: "Emergent", ar: "طارئة حرجة" }, 3: { en: "Urgent", ar: "عاجلة" },
  4: { en: "Less urgent", ar: "أقل استعجالاً" }, 5: { en: "Non-urgent", ar: "غير عاجلة" },
};
const STATUS_LABEL: Record<ERCase["status"], { en: string; ar: string }> = {
  triage: { en: "In triage", ar: "قيد الفرز" }, "in-treatment": { en: "In treatment", ar: "تحت العلاج" }, "awaiting-bed": { en: "Awaiting bed", ar: "بانتظار سرير" },
  admitted: { en: "Admitted", ar: "تم القبول" }, discharged: { en: "Discharged", ar: "تم الخروج" }, referred: { en: "Referred", ar: "تمت الإحالة" },
};
const OPEN: ERCase["status"][] = ["triage", "in-treatment", "awaiting-bed"];
const dash = (v: number | string | undefined, suffix = "") => (v === undefined || v === null || v === "" ? "—" : `${v}${suffix}`);

export default function ErTriagePage() {
  const { locale, t } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [cases, setCases] = useState<ERCase[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [selected, setSelected] = useState<ERCase | null>(null);
  const [bedId, setBedId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, b] = await Promise.all([api.getErCases(), api.getBeds()]);
      setCases(c); setBeds(b);
    } catch (e) { handleError(e); }
  }, [handleError]);
  useEffect(() => { void load(); }, [load]);

  const availableBeds = beds.filter((b) => b.status === "available");
  const sorted = useMemo(() => [...cases].sort((a, b) => a.acuity - b.acuity), [cases]);

  async function admit() {
    if (!selected || !bedId) return;
    setBusy(true);
    try {
      await api.admitEr(selected.id, bedId);
      push("success", ar ? "تم قبول الحالة وتخصيص السرير" : "Case admitted and bed assigned");
      setSelected(null); setBedId(""); await load();
    } catch (e) { handleError(e); await load(); } finally { setBusy(false); }
  }

  const v = selected?.vitals ?? {};
  return (
    <div className="flex flex-col gap-5">
      <PageHeader icon={Siren} title={ar ? "استقبال وفرز الطوارئ" : "ER intake & clinical triage"} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Siren} label={ar ? "حالات حرجة (1-2)" : "Critical (ESI 1-2)"} value={cases.filter((c) => c.acuity <= 2 && OPEN.includes(c.status)).length} tone="error" />
        <StatCard icon={Activity} label={ar ? "تحت العلاج" : "In treatment"} value={cases.filter((c) => c.status === "in-treatment").length} tone="secondary" />
        <StatCard icon={Clock} label={ar ? "بانتظار سرير" : "Awaiting bed"} value={cases.filter((c) => c.status === "awaiting-bed").length} tone="warning" />
        <StatCard icon={Ambulance} label={ar ? "الإجمالي" : "Total"} value={cases.length} tone="primary" />
      </div>
      <Card>
        <CardHeader><CardTitle>{ar ? "لوحة الفرز حسب الأولوية" : "Triage board — by acuity"}</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {sorted.length === 0 && <p className="py-6 text-center text-sm text-on-surface-variant">{ar ? "لا توجد حالات" : "No cases"}</p>}
          {sorted.map((c) => (
            <button key={c.id} onClick={() => { setSelected(c); setBedId(""); }} className={cn("flex flex-col gap-2 rounded-lg border p-3 text-start transition-colors sm:flex-row sm:items-center sm:justify-between", c.acuity <= 2 && OPEN.includes(c.status) ? "border-error/40 bg-error-container/20" : "border-outline-variant/40 hover:bg-surface-container-low")}>
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0"><Image src={c.patient.photoUrl} alt="" fill sizes="44px" className="rounded-lg object-cover" unoptimized /></div>
                <div>
                  <div className="flex items-center gap-2"><p className="text-sm font-bold text-on-surface">{pick(c.patient.fullName, locale)}</p><span className="text-xs text-on-surface-variant">{formatTime(c.arrivedAt, locale)}</span></div>
                  <p className="text-xs text-on-surface-variant">{pick(c.chiefComplaint, locale)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 ps-14 sm:ps-0">
                <Badge tone={ACUITY_TONE[c.acuity]}>ESI {c.acuity} — {pick(ACUITY_LABEL[c.acuity], locale)}</Badge>
                <Badge tone="neutral">{pick(STATUS_LABEL[c.status], locale)}</Badge>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? pick(selected.patient.fullName, locale) : ""} size="lg">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone={ACUITY_TONE[selected.acuity]}>ESI {selected.acuity} — {pick(ACUITY_LABEL[selected.acuity], locale)}</Badge>
              <span className="text-xs text-on-surface-variant">{pick(selected.arrivalMode, locale)} • {formatTime(selected.arrivedAt, locale)}</span>
            </div>
            <p className="rounded-lg bg-surface-container-low p-3 text-sm font-semibold text-on-surface">{pick(selected.chiefComplaint, locale)}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: HeartPulse, label: ar ? "ضغط الدم" : "BP", value: dash(v.bloodPressure) },
                { icon: Activity, label: ar ? "النبض" : "HR", value: dash(v.heartRate, " bpm") },
                { icon: Thermometer, label: ar ? "الحرارة" : "Temp", value: dash(v.temperature, "°C") },
                { icon: Wind, label: "SpO2", value: dash(v.spo2, "%") },
              ].map((x, i) => (
                <div key={i} className="flex flex-col items-center gap-1 rounded-lg bg-surface-container-low p-3 text-center">
                  <x.icon className="h-4 w-4 text-secondary" /><span className="text-sm font-bold tabular-nums text-on-surface">{x.value}</span><span className="text-[10px] text-on-surface-variant">{x.label}</span>
                </div>
              ))}
            </div>
            {selected.patient.allergies.length > 0 && <div className="flex flex-wrap gap-1.5">{selected.patient.allergies.map((a, i) => <Badge key={i} tone="error">{pick(a, locale)}</Badge>)}</div>}
            {OPEN.includes(selected.status) ? (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">{ar ? "اختر سريراً متاحاً" : "Choose an available bed"}</label>
                <select value={bedId} onChange={(e) => setBedId(e.target.value)} className="h-10 rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50">
                  <option value="">{availableBeds.length ? "—" : ar ? "لا توجد أسرة متاحة" : "No beds available"}</option>
                  {availableBeds.map((b) => <option key={b.id} value={b.id}>{pick(b.ward, locale)} — {b.bedNumber}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setSelected(null)}>{t("common.close")}</Button>
                  <Button loading={busy} disabled={!bedId} onClick={admit}>{ar ? "قبول وتخصيص السرير" : "Admit & assign bed"}</Button>
                </div>
              </div>
            ) : <Button variant="outline" onClick={() => setSelected(null)}>{t("common.close")}</Button>}
          </div>
        )}
      </Modal>
    </div>
  );
}
