"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pick as pickBilingual } from "@/lib/utils/format";
import { api, patientId } from "@/lib/data/service";
import type { Bed, Bilingual, ERCase, NationalIdentity } from "@/types/domain";
import { Ambulance, Siren, BedDouble, PlusCircle, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function EmsTransfersPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const pick = (v: Bilingual) => pickBilingual(v, locale);

  const [erCases, setErCases] = useState<ERCase[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<NationalIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDispatch, setShowDispatch] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    patientId: "",
    unitCode: "AMB-CAI-123",
    complaintEn: "Acute Chest Pain — Suspected STEMI via EMS Telemetry",
    complaintAr: "ألم حاد بالصدر — اشتباه جلطة قلبية محولة بالإسعاف",
    acuity: 1,
    hr: 118,
    bp: "165/100",
    spo2: 92,
    temp: 37.2,
  });
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cList, bList, pList] = await Promise.all([
        api.getErCases(),
        api.getBeds(),
        api.searchPatients(""),
      ]);
      setErCases(cList);
      const availBeds = bList.filter((b) => b.status === "available");
      setBeds(availBeds);
      setPatients(pList);
      if (pList.length > 0 && !form.patientId) {
        setForm((f) => ({ ...f, patientId: patientId(pList[0]!) }));
      }
      if (availBeds.length > 0) {
        const map: Record<string, string> = {};
        cList.forEach((c) => { map[c.id] = availBeds[0]!.id; });
        setSelectedBed(map);
      }
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to load EMS & ER cases" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const registerAmbulanceArrival = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createErIntake({
        patientId: form.patientId,
        arrivalEn: `Ambulance ${form.unitCode}`,
        arrivalAr: `إسعاف ${form.unitCode}`,
        complaintEn: form.complaintEn,
        complaintAr: form.complaintAr,
        acuity: Number(form.acuity),
        areaEn: Number(form.acuity) <= 2 ? "Resuscitation Bay 1" : "ER Triage Zone A",
        areaAr: Number(form.acuity) <= 2 ? "غرفة الإنعاش القلبي ١" : "منطقة فرز الطوارئ أ",
        vitals: { hr: form.hr, bp: form.bp, spo2: form.spo2, temp: form.temp },
      });
      setToast({
        type: "ok",
        msg: isAr ? `تم تسجيل وصول سيارة الإسعاف ${form.unitCode} وإدراج الحالة في طوارئ المستشفى فوراً` : `EMS Unit ${form.unitCode} arrival logged into ER Triage`,
      });
      setShowDispatch(false);
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to log EMS arrival" });
    }
  };

  const handleAdmit = async (erId: string) => {
    const bedId = selectedBed[erId];
    if (!bedId) return;
    try {
      await api.admitEr(erId, bedId);
      setToast({
        type: "ok",
        msg: isAr ? "تم تسكين حالة الإسعاف في سرير الرعاية الداخلية بنجاح" : "Patient admitted to inpatient bed",
      });
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Admission failed" });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Ambulance}
        title={isAr ? "استقبال سيارات الإسعاف والتحويلات الحرجة" : "EMS Ambulance Dispatch & Emergency Transfers"}
        meta={
          isAr
            ? "ربط مباشر مع سيارات الإسعاف المجهزة لاستلام العلامات الحيوية للمصابين قبل الوصول وتسكينهم الفوري في أسرة الطوارئ والرعاية"
            : "Live telemetry link with Egyptian Ambulance Authority (123) units for pre-arrival triage and direct bed admission"
        }
        actions={
          <button
            onClick={() => setShowDispatch(!showDispatch)}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-red-700"
          >
            <PlusCircle className="w-4 h-4" />
            {isAr ? "تسجيل بلاغ إسعاف وارد" : "Log Incoming Ambulance"}
          </button>
        }
      />

      {toast && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${toast.type === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {showDispatch && (
        <Card className="p-5 border-2 border-red-500/40">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-red-600">
            <Siren className="w-4 h-4" />
            {isAr ? "تسجيل وصول حالة إسعاف طارئة" : "Register Incoming EMS Ambulance Case"}
          </h3>
          <form onSubmit={registerAmbulanceArrival} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "المواطن المصاب" : "Patient"}</label>
              <select
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
              >
                {patients.map((p) => (
                  <option key={patientId(p)} value={patientId(p)}>
                    {pick(p.fullName)} ({p.mti}) — {p.bloodType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "كود سيارة الإسعاف" : "Ambulance Unit Code"}</label>
              <input
                required
                value={form.unitCode}
                onChange={(e) => setForm({ ...form, unitCode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "مستوى الخطورة (ESI 1-5)" : "Triage Acuity (1=Critical)"}</label>
              <select
                value={form.acuity}
                onChange={(e) => setForm({ ...form, acuity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
              >
                <option value={1}>Level 1 — Resuscitation (إنعاش فوري)</option>
                <option value={2}>Level 2 — Emergent (حرج جداً)</option>
                <option value={3}>Level 3 — Urgent (عاجل)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "الشكوى الطبية الحرجة" : "Chief Complaint"}</label>
              <input
                required
                value={isAr ? form.complaintAr : form.complaintEn}
                onChange={(e) => setForm({ ...form, complaintAr: e.target.value, complaintEn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-on-surface-variant mb-1">HR (bpm)</label>
                <input type="number" value={form.hr} onChange={(e) => setForm({ ...form, hr: Number(e.target.value) })} className="w-full px-2 py-2 rounded-lg border border-outline-variant/40 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[10px] text-on-surface-variant mb-1">BP</label>
                <input value={form.bp} onChange={(e) => setForm({ ...form, bp: e.target.value })} className="w-full px-2 py-2 rounded-lg border border-outline-variant/40 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[10px] text-on-surface-variant mb-1">SpO2 %</label>
                <input type="number" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: Number(e.target.value) })} className="w-full px-2 py-2 rounded-lg border border-outline-variant/40 text-xs font-mono" />
              </div>
            </div>
            <div className="md:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDispatch(false)} className="px-4 py-2 rounded-lg border border-outline-variant/40 text-xs">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" className="px-5 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold">
                {isAr ? "تأكيد وصول الإسعاف" : "Confirm EMS Intake"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <div className="text-xs text-on-surface-variant">
          {isAr ? `الأسرة المتاحة للتسكين الفوري: ${beds.length} سرير` : `Available Beds for Immediate Admission: ${beds.length}`}
        </div>
        <button onClick={load} className="px-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          {isAr ? "تحديث" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-sm text-on-surface-variant">{isAr ? "جاري التحميل..." : "Loading active EMS transfers..."}</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {erCases.map((c) => (
            <Card key={c.id} className="p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                      c.acuity === 1 ? "bg-red-600 text-white" : c.acuity === 2 ? "bg-amber-500 text-white" : "bg-blue-500/10 text-blue-600"
                    }`}>
                      ESI-{c.acuity}
                    </span>
                    <div>
                      <h3 className="font-bold text-base">{pick(c.patient.fullName)}</h3>
                      <div className="text-xs font-mono text-on-surface-variant">{c.patient.mti} · {c.patient.bloodType}</div>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-surface-container-low font-semibold flex items-center gap-1">
                    <Ambulance className="w-3.5 h-3.5 text-red-500" />
                    {pick(c.arrivalMode)}
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-surface-container-low text-xs space-y-1">
                  <div className="font-semibold text-on-surface">{pick(c.chiefComplaint)}</div>
                  <div className="text-on-surface-variant">{isAr ? "المنطقة:" : "Area:"} {pick(c.assignedArea)}</div>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  <div className="p-2 rounded-lg border border-outline-variant/40">
                    <div className="text-[10px] text-on-surface-variant">HR</div>
                    <div className="font-mono font-bold text-xs">{(c.vitals as any)?.hr ?? (c.vitals as any)?.heartRate ?? "—"}</div>
                  </div>
                  <div className="p-2 rounded-lg border border-outline-variant/40">
                    <div className="text-[10px] text-on-surface-variant">BP</div>
                    <div className="font-mono font-bold text-xs">{(c.vitals as any)?.bp ?? (c.vitals as any)?.bloodPressure ?? "—"}</div>
                  </div>
                  <div className="p-2 rounded-lg border border-outline-variant/40">
                    <div className="text-[10px] text-on-surface-variant">SpO2</div>
                    <div className="font-mono font-bold text-xs">{(c.vitals as any)?.spo2 ? `${(c.vitals as any).spo2}%` : "—"}</div>
                  </div>
                  <div className="p-2 rounded-lg border border-outline-variant/40">
                    <div className="text-[10px] text-on-surface-variant">Temp</div>
                    <div className="font-mono font-bold text-xs">{(c.vitals as any)?.temp ? `${(c.vitals as any).temp}°C` : "—"}</div>
                  </div>
                </div>
              </div>

              {c.status !== "admitted" && c.status !== "discharged" ? (
                <div className="pt-3 border-t border-outline-variant/40 flex items-center gap-2">
                  <select
                    value={selectedBed[c.id] ?? ""}
                    onChange={(e) => setSelectedBed({ ...selectedBed, [c.id]: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono"
                  >
                    {beds.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bedNumber} — {pick(b.ward)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAdmit(c.id)}
                    disabled={beds.length === 0}
                    className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <BedDouble className="w-3.5 h-3.5" />
                    {isAr ? "تسكين في سرير" : "Admit to Bed"}
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-outline-variant/40 text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {isAr ? "تم التسكين في القسم الداخلي" : "Admitted to Inpatient Ward"}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
