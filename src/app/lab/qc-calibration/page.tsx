"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { api } from "@/lib/data/service";
import { Radar, CheckCircle2, AlertTriangle, Wrench, PlusCircle, RefreshCw } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function QcCalibrationPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [instruments, setInstruments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calModal, setCalModal] = useState<any | null>(null);
  const [calResult, setCalResult] = useState<"PASS" | "ADJUSTED" | "FAIL">("PASS");
  const [calNotes, setCalNotes] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newInst, setNewInst] = useState({ code: "", nameEn: "", nameAr: "", model: "" });
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.getLabInstruments();
      setInstruments(list);
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to load lab instruments" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submitCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calModal) return;
    try {
      await api.addLabCalibration(calModal.id, { result: calResult, notes: calNotes });
      setToast({
        type: "ok",
        msg: isAr ? `تم تسجيل معايرة الجهاز ${calModal.nameAr} بنجاح (${calResult})` : `Calibration logged for ${calModal.nameEn} (${calResult})`,
      });
      setCalModal(null);
      setCalNotes("");
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to log calibration" });
    }
  };

  const createInstrument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLabInstrument(newInst);
      setToast({ type: "ok", msg: isAr ? "تمت إضافة جهاز التحليل بنجاح" : "Analyzer added successfully" });
      setShowAdd(false);
      setNewInst({ code: "", nameEn: "", nameAr: "", model: "" });
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to add analyzer" });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Radar}
        title={isAr ? "معايرة الأجهزة المعملية وضبط الجودة القياسي" : "Lab Analyzer QC & Calibration Logs"}
        meta={
          isAr
            ? "متابعة الحالة التشغيلية لأجهزة التحاليل الطبية وتسجيل شهادات المعايرة اليومية والدورية"
            : "Track operational status of clinical analyzers and record daily quality control calibration checks"
        }
        actions={
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            {isAr ? "إضافة جهاز تحليل" : "Add Analyzer"}
          </button>
        }
      />

      {toast && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${toast.type === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {showAdd && (
        <Card className="p-5">
          <h3 className="font-bold text-sm mb-3">{isAr ? "إضافة جهاز معملي جديد" : "Register New Lab Analyzer"}</h3>
          <form onSubmit={createInstrument} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              required
              placeholder={isAr ? "كود الجهاز (ANL-05)" : "Code (e.g. ANL-05)"}
              value={newInst.code}
              onChange={(e) => setNewInst({ ...newInst, code: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
            />
            <input
              required
              placeholder={isAr ? "الاسم بالإنجليزية" : "English Name"}
              value={newInst.nameEn}
              onChange={(e) => setNewInst({ ...newInst, nameEn: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
            />
            <input
              required
              placeholder={isAr ? "الاسم بالعربية" : "Arabic Name"}
              value={newInst.nameAr}
              onChange={(e) => setNewInst({ ...newInst, nameAr: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
            />
            <input
              required
              placeholder={isAr ? "الموديل / الشركة" : "Model / Manufacturer"}
              value={newInst.model}
              onChange={(e) => setNewInst({ ...newInst, model: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
            />
            <div className="md:col-span-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-outline-variant/40 text-xs">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold">
                {isAr ? "حفظ الجهاز" : "Save Analyzer"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {calModal && (
        <Card className="p-5 border-2 border-primary">
          <h3 className="font-bold text-sm mb-3">
            {isAr ? `تسجيل شهادة معايرة: ${calModal.nameAr}` : `Log QC Calibration: ${calModal.nameEn}`}
          </h3>
          <form onSubmit={submitCalibration} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "نتيجة الفحص القياسي" : "QC Result"}</label>
              <select
                value={calResult}
                onChange={(e) => setCalResult(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
              >
                <option value="PASS">{isAr ? "مطابق للمواصفات (PASS — تشغيل)" : "PASS — Set Online"}</option>
                <option value="ADJUSTED">{isAr ? "تم الضبط وإعادة المعايرة (ADJUSTED)" : "ADJUSTED — Recalibrated & Online"}</option>
                <option value="FAIL">{isAr ? "غير مطابق / يحتاج صيانة (FAIL)" : "FAIL — Flag Maintenance"}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "ملاحظات المعايرة" : "Technician Notes"}</label>
              <input
                value={calNotes}
                onChange={(e) => setCalNotes(e.target.value)}
                placeholder={isAr ? "مثال: تم فحص محاليل التحكم القياسية L1/L2 بنجاح" : "e.g. Control sera L1/L2 within 1 SD"}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setCalModal(null)} className="px-4 py-2 rounded-lg border border-outline-variant/40 text-xs">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold">
                {isAr ? "اعتماد المعايرة" : "Confirm Calibration"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex justify-end">
        <button onClick={load} className="px-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          {isAr ? "تحديث الحالة" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-sm text-on-surface-variant">{isAr ? "جاري التحميل..." : "Loading instruments..."}</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instruments.map((inst) => (
            <Card key={inst.id} className="p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono text-on-surface-variant">{inst.code} · {inst.model}</div>
                    <h3 className="font-bold text-base mt-0.5">{isAr ? inst.nameAr : inst.nameEn}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    inst.status === "ONLINE" ? "bg-emerald-500/10 text-emerald-600" :
                    inst.status === "CALIBRATING" ? "bg-amber-500/10 text-amber-600" :
                    "bg-red-500/10 text-red-600"
                  }`}>
                    {inst.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-surface-container-low text-xs">
                  <div>
                    <div className="text-on-surface-variant">{isAr ? "آخر معايرة" : "Last Calibrated"}</div>
                    <div className="font-mono font-semibold mt-0.5">
                      {inst.lastCalibrated ? new Date(inst.lastCalibrated).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant">{isAr ? "المعايرة القادمة" : "Next Due"}</div>
                    <div className="font-mono font-semibold mt-0.5">
                      {inst.nextCalibration ? new Date(inst.nextCalibration).toLocaleDateString() : "—"}
                    </div>
                  </div>
                </div>

                {inst.calibrations?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-[11px] font-semibold text-on-surface-variant">{isAr ? "سجل المعايرات الأخيرة:" : "Recent QC Logs:"}</div>
                    {inst.calibrations.slice(0, 2).map((c: any) => (
                      <div key={c.id} className="text-xs flex items-center justify-between py-1 border-b border-outline-variant/30">
                        <span className="font-mono font-semibold">{c.result}</span>
                        <span className="text-on-surface-variant truncate max-w-[180px]">{c.notes || "QC Check"}</span>
                        <span className="font-mono text-[10px] text-on-surface-variant">{new Date(c.performedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-outline-variant/40 flex justify-end">
                <button
                  onClick={() => { setCalModal(inst); setCalResult("PASS"); }}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 hover:opacity-90"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  {isAr ? "تسجيل معايرة جديدة" : "Log QC Calibration"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
