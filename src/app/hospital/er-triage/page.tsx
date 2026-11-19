"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Siren, HeartPulse, Thermometer, Activity, Wind, Ambulance, Clock, RefreshCw, Plus, CheckCircle2 } from "lucide-react";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api, patientId } from "@/lib/data/service";
import type { AcuityLevel, Bed, ERCase, NationalIdentity } from "@/types/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { IncomingReferralsCard } from "@/components/referrals/IncomingReferralsCard";
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
  const { user: me } = useAuth();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [cases, setCases] = useState<ERCase[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [referrals, setReferrals] = useState<Awaited<ReturnType<typeof api.getReferrals>>>([]);
  const [selected, setSelected] = useState<ERCase | null>(null);
  const [bedId, setBedId] = useState("");
  const [busy, setBusy] = useState(false);

  const [intakeOpen, setIntakeOpen] = useState(false);
  const [patQuery, setPatQuery] = useState("");
  const [patients, setPatients] = useState<NationalIdentity[]>([]);
  const [selectedPat, setSelectedPat] = useState<NationalIdentity | null>(null);
  const [complaintEn, setComplaintEn] = useState("Acute Chest Pain / Trauma Assessment");
  const [complaintAr, setComplaintAr] = useState("ألم حاد بالصدر / تقييم طوارئ عاجل");
  const [acuity, setAcuity] = useState(2);
  const [arrivalMode, setArrivalMode] = useState<"WALK_IN" | "EMS">("WALK_IN");
  const [erArea, setErArea] = useState("ER Triage Zone A");
  const [vitalsForm, setVitalsForm] = useState({ bp: "145/90", hr: "102", temp: "37.4", spo2: "95" });

  const load = useCallback(async () => {
    try {
      const [c, b, refs] = await Promise.all([
        api.getErCases(),
        api.getBeds(),
        api.getReferrals().catch(() => []),
      ]);
      setCases(c); setBeds(b); setReferrals(refs);
    } catch (e) { handleError(e); }
  }, [handleError]);
  useEffect(() => { void load(); }, [load]);
  useAutoRefresh(load, 15_000);

  useEffect(() => {
    if (!intakeOpen) return;
    api
      .searchPatients(patQuery.trim())
      .then((res) => {
        setPatients(res);
        if (!selectedPat && res[0]) setSelectedPat(res[0]);
      })
      .catch(() => {});
  }, [intakeOpen, patQuery, selectedPat]);

  const availableBeds = beds.filter((b) => b.status === "available");
  const sorted = useMemo(() => [...cases].sort((a, b) => a.acuity - b.acuity), [cases]);

  async function submitErIntake() {
    if (!selectedPat) return;
    setBusy(true);
    try {
      await api.createErIntake({
        patientId: patientId(selectedPat),
        arrivalEn: arrivalMode === "EMS" ? "EMS Ambulance Arrival" : "Walk-In ER Arrival",
        arrivalAr: arrivalMode === "EMS" ? "وصول بسيارة إسعاف" : "حضور مباشر للطوارئ",
        complaintEn: complaintEn.trim() || complaintAr.trim(),
        complaintAr: complaintAr.trim() || complaintEn.trim(),
        acuity,
        areaEn: erArea,
        areaAr: erArea === "Resuscitation Bay" ? "غرفة الإنعاش والطوارئ الحرجة" : "منطقة فرز الطوارئ أ",
        vitals: {
          bloodPressure: vitalsForm.bp,
          heartRate: vitalsForm.hr,
          temperature: vitalsForm.temp,
          spo2: vitalsForm.spo2,
        },
      });
      push("success", ar ? "تم تسجيل حالة الطوارئ وإدراجها في لوحة الفرز" : "ER triage case registered");
      setIntakeOpen(false);
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }

  async function updateCaseStatus(id: string, status: "IN_TREATMENT" | "DISCHARGED") {
    setBusy(true);
    try {
      await api.setErStatus(id, status);
      push(
        "success",
        status === "IN_TREATMENT"
          ? ar ? "تم بدء العلاج في قسم الطوارئ" : "Case moved to in-treatment"
          : ar ? "تم تسجيل خروج المريض من الطوارئ" : "Patient discharged from ER"
      );
      setSelected(null);
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }

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
      <PageHeader
        icon={Siren}
        title={ar ? "استقبال وفرز الطوارئ" : "ER intake & clinical triage"}
        badge={(ar ? me?.facilityAr : me?.facilityEn) || (ar ? "مزامنة حية (15 ث)" : "Live Sync 15s")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIntakeOpen(true)}>
              {ar ? "تسجيل حالة طوارئ" : "Register ER Case"}
            </Button>
            <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={load}>
              {ar ? "تحديث" : "Refresh"}
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Siren} label={ar ? "حالات حرجة (1-2)" : "Critical (ESI 1-2)"} value={cases.filter((c) => c.acuity <= 2 && OPEN.includes(c.status)).length} tone="error" />
        <StatCard icon={Activity} label={ar ? "تحت العلاج" : "In treatment"} value={cases.filter((c) => c.status === "in-treatment").length} tone="secondary" />
        <StatCard icon={Clock} label={ar ? "بانتظار سرير" : "Awaiting bed"} value={cases.filter((c) => c.status === "awaiting-bed").length} tone="warning" />
        <StatCard icon={Ambulance} label={ar ? "الإجمالي" : "Total"} value={cases.length} tone="primary" />
      </div>
      <IncomingReferralsCard targetType="HOSPITAL" referrals={referrals} onUpdated={load} />
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
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {selected.status === "triage" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busy}
                      icon={<Activity className="h-4 w-4" />}
                      onClick={() => void updateCaseStatus(selected.id, "IN_TREATMENT")}
                    >
                      {ar ? "بدء العلاج بالطوارئ" : "Start Treatment"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busy}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    onClick={() => void updateCaseStatus(selected.id, "DISCHARGED")}
                  >
                    {ar ? "خروج بعد العلاج" : "Discharge Patient"}
                  </Button>
                </div>
                <label className="text-sm font-semibold text-on-surface">{ar ? "أو اختر سريراً متاحاً للتنويم:" : "Or choose an available bed for admission:"}</label>
                <select value={bedId} onChange={(e) => setBedId(e.target.value)} className="h-10 rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50">
                  <option value="">{availableBeds.length ? "—" : ar ? "لا توجد أسرة متاحة" : "No beds available"}</option>
                  {availableBeds.map((b) => <option key={b.id} value={b.id}>{pick(b.ward, locale)} — {b.bedNumber}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setSelected(null)}>{t("common.close")}</Button>
                  <Button loading={busy} disabled={!bedId} onClick={admit}>{ar ? "قبول وتخصيص السرير" : "Admit & assign bed"}</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-end gap-2">
                {selected.status !== "discharged" && (
                  <Button
                    variant="outline"
                    loading={busy}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    onClick={() => void updateCaseStatus(selected.id, "DISCHARGED")}
                  >
                    {ar ? "خروج بعد العلاج" : "Discharge Patient"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelected(null)}>{t("common.close")}</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={intakeOpen}
        onClose={() => setIntakeOpen(false)}
        title={ar ? "تسجيل حالة طوارئ جديدة بالمستشفى" : "Register New Hospital ER Triage Case"}
        size="lg"
      >
        <div className="flex flex-col gap-3">
          <SearchInput
            value={patQuery}
            onChange={setPatQuery}
            placeholder={ar ? "ابحث بالاسم أو الرقم القومي أو كود MTI..." : "Search citizen by Name, National ID, or MTI..."}
          />
          <div className="max-h-36 overflow-y-auto rounded-lg border border-outline-variant/40 divide-y divide-outline-variant/20">
            {patients.map((p) => {
              const pid = patientId(p);
              const isSel = selectedPat && patientId(selectedPat) === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setSelectedPat(p)}
                  className={`w-full flex items-center justify-between p-2 text-start text-xs ${isSel ? "bg-primary-container text-on-primary-container font-bold" : "hover:bg-surface-container-low"}`}
                >
                  <span>{pick(p.fullName, locale)} — MTI: {p.mti}</span>
                  <Badge tone="secondary">{p.bloodType}</Badge>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={arrivalMode}
              onChange={(e) => setArrivalMode(e.target.value as "WALK_IN" | "EMS")}
              className="h-10 rounded-lg bg-surface-container-low px-3 text-sm outline-none"
            >
              <option value="WALK_IN">{ar ? "حضور مباشر للطوارئ" : "Walk-In ER Arrival"}</option>
              <option value="EMS">{ar ? "وصول بسيارة إسعاف (123)" : "EMS Ambulance Arrival"}</option>
            </select>
            <select
              value={acuity}
              onChange={(e) => setAcuity(Number(e.target.value))}
              className="h-10 rounded-lg bg-surface-container-low px-3 text-sm outline-none"
            >
              <option value={1}>ESI 1 — {ar ? "إنعاش فوري" : "Resuscitation"}</option>
              <option value={2}>ESI 2 — {ar ? "طارئة حرجة" : "Emergent"}</option>
              <option value={3}>ESI 3 — {ar ? "عاجلة" : "Urgent"}</option>
              <option value={4}>ESI 4 — {ar ? "أقل استعجالاً" : "Less Urgent"}</option>
              <option value={5}>ESI 5 — {ar ? "غير عاجلة" : "Non-Urgent"}</option>
            </select>
            <select
              value={erArea}
              onChange={(e) => setErArea(e.target.value)}
              className="h-10 rounded-lg bg-surface-container-low px-3 text-sm outline-none"
            >
              <option value="ER Triage Zone A">{ar ? "منطقة فرز الطوارئ أ" : "ER Triage Zone A"}</option>
              <option value="Resuscitation Bay">{ar ? "غرفة الإنعاش الحرجة" : "Resuscitation Bay"}</option>
            </select>
          </div>
          <input
            value={complaintAr}
            onChange={(e) => setComplaintAr(e.target.value)}
            placeholder={ar ? "الشكوى الطبية (عربي)" : "Chief Complaint (Arabic)"}
            className="h-10 rounded-lg bg-surface-container-low px-3 text-sm outline-none"
          />
          <input
            value={complaintEn}
            onChange={(e) => setComplaintEn(e.target.value)}
            dir="ltr"
            placeholder="Chief Complaint (English)"
            className="h-10 rounded-lg bg-surface-container-low px-3 text-sm outline-none"
          />
          <div className="grid grid-cols-4 gap-2 text-xs">
            <input value={vitalsForm.bp} onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })} dir="ltr" placeholder="BP" className="h-9 rounded-lg bg-surface-container-low px-2 font-mono" />
            <input value={vitalsForm.hr} onChange={(e) => setVitalsForm({ ...vitalsForm, hr: e.target.value })} dir="ltr" placeholder="HR" className="h-9 rounded-lg bg-surface-container-low px-2 font-mono" />
            <input value={vitalsForm.temp} onChange={(e) => setVitalsForm({ ...vitalsForm, temp: e.target.value })} dir="ltr" placeholder="Temp" className="h-9 rounded-lg bg-surface-container-low px-2 font-mono" />
            <input value={vitalsForm.spo2} onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })} dir="ltr" placeholder="SpO2%" className="h-9 rounded-lg bg-surface-container-low px-2 font-mono" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setIntakeOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button loading={busy} disabled={!selectedPat} onClick={() => void submitErIntake()}>
              {ar ? "تسجيل وإدراج بفرز الطوارئ" : "Confirm ER Intake"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
