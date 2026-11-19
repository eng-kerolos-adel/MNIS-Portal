"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { pick as pickBilingual } from "@/lib/utils/format";
import { api, patientId } from "@/lib/data/service";
import type { Bilingual, ConditionFlagItem, NationalIdentity } from "@/types/domain";
import { Send, PlusCircle, CheckCircle2, AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function DoctorReferralsPage() {
  const { locale } = useLocale();
  const { user: me } = useAuth();
  const isAr = locale === "ar";
  const pick = (v: Bilingual) => pickBilingual(v, locale);
  const canActOnIncoming = !me || me.role !== "DOCTOR";

  const [referrals, setReferrals] = useState<any[]>([]);
  const [conditionFlags, setConditionFlags] = useState<ConditionFlagItem[]>([]);
  const [patients, setPatients] = useState<NationalIdentity[]>([]);
  const [labs, setLabs] = useState<{ id: string; nameEn: string; nameAr: string }[]>([]);
  const [hospitals, setHospitals] = useState<{ id: string; nameEn: string; nameAr: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterTarget, setFilterTarget] = useState<string>("ALL");
  const [form, setForm] = useState({
    patientId: "",
    targetType: "HOSPITAL",
    urgency: "ROUTINE",
    departmentEn: "Cardiology",
    departmentAr: "أمراض القلب والأوعية الدموية",
    testPanel: "CBC",
    medicationEn: "",
    medicationAr: "",
    clinicalNoteEn: "Referred for specialist evaluation and follow-up.",
    clinicalNoteAr: "تحويل طبي لتقييم الاستشاري والمتابعة المتخصصة.",
  });
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const isDoc = !me || me.role === "DOCTOR";
      const [refList, queueList, rxList, adminPatients, flagList, labList, hospList] = await Promise.all([
        api.getReferrals(),
        api.getQueue().catch(() => []),
        api.getPrescriptions().catch(() => []),
        isDoc ? Promise.resolve([] as NationalIdentity[]) : api.searchPatients("").catch(() => []),
        api.getConditionFlags().catch(() => []),
        api.getLabs().catch(() => []),
        api.getHospitals().catch(() => []),
      ]);
      const pMap = new Map<string, NationalIdentity>();
      for (const tk of queueList) pMap.set(patientId(tk.patient), tk.patient);
      for (const rx of rxList) pMap.set(patientId(rx.patient), rx.patient);
      for (const ap of adminPatients) pMap.set(patientId(ap), ap);
      const patList = Array.from(pMap.values());

      setReferrals(refList);
      setPatients(patList);
      setConditionFlags(flagList);
      setLabs(labList);
      setHospitals(hospList);
      if (patList.length > 0 && !form.patientId) {
        setForm((f) => ({ ...f, patientId: patientId(patList[0]!) }));
      }
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to load referrals" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (me) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.role]);

  const handleReviewFlag = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await api.reviewConditionFlag(id, status);
      setToast({
        type: "ok",
        msg: status === "APPROVED"
          ? (isAr ? "تم اعتماد التنبيه وإضافته تلقائياً للملف الطبي وبطاقة الطوارئ للمواطن" : "Condition approved and added to citizen medical profile & NFC card")
          : (isAr ? "تم رفض التنبيه المعملي" : "Condition flag rejected"),
      });
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Review failed" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createReferral(form);
      setToast({
        type: "ok",
        msg: isAr
          ? "تم إرسال التحويل الطبي بنجاح وربطه تلقائياً بالجهة المستقبلة"
          : "Referral created and automatically routed to target department",
      });
      setShowAdd(false);
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to create referral" });
    }
  };

  const handleAction = async (id: string, status: string) => {
    try {
      await api.actOnReferral(id, status, "Processed via MNIS Portal", "تمت المعالجة عبر البوابة الموحدة");
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Action failed" });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.cancelReferral(id);
      setToast({
        type: "ok",
        msg: isAr ? "تم إلغاء التحويل الطبي بنجاح" : "Referral cancelled",
      });
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Cancel failed" });
    }
  };

  const filtered = referrals.filter((r) => filterTarget === "ALL" || r.targetType === filterTarget);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Send}
        title={isAr ? "إدارة التحويلات بين المستشفيات والمعامل والصيدليات" : "Inter-Facility Clinical Referrals"}
        meta={
          isAr
            ? "إرسال ومتابعة التحويلات الطبية الفورية للمستشفيات المتخصصة أو المعامل المركزية أو الصيدليات مع التوجيه الآلي للطوارئ والعينات"
            : "Issue and track real-time referrals across hospitals, central laboratories, and pharmacies with automated ER/Lab routing"
        }
        actions={
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            {isAr ? "إنشاء تحويل طبي جديد" : "New Clinical Referral"}
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
          <h3 className="font-bold text-sm mb-4">{isAr ? "إصدار تحويل طبي جديد" : "Create New Clinical Referral"}</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "المريض" : "Patient"}</label>
              <select
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
              >
                {patients.map((p) => (
                  <option key={patientId(p)} value={patientId(p)}>
                    {pick(p.fullName)} ({p.mti})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "جهة التحويل" : "Target Facility"}</label>
              <select
                value={form.targetType}
                onChange={(e) => setForm({ ...form, targetType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
              >
                <option value="HOSPITAL">{isAr ? "مستشفى / قسم متخصص (HOSPITAL)" : "Hospital / Specialist Dept"}</option>
                <option value="LAB">{isAr ? "معمل مركزي (LAB — ينشئ عينة تلقائياً)" : "Central Lab (Auto-creates sample)"}</option>
                <option value="PHARMACY">{isAr ? "صيدلية (PHARMACY)" : "Pharmacy"}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "درجة الأولوية" : "Urgency"}</label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
              >
                <option value="ROUTINE">{isAr ? "اعتيادي (ROUTINE)" : "Routine"}</option>
                <option value="CRITICAL">{isAr ? "طوارئ حرجة (CRITICAL)" : "Critical / Emergency"}</option>
              </select>
            </div>

            {form.targetType === "HOSPITAL" && (
              <>
                {hospitals.length > 0 && (
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">
                      {isAr ? "المستشفى المستقبِل بالشبكة القومية" : "Target Registered Hospital"}
                    </label>
                    <select
                      onChange={(e) => {
                        const h = hospitals.find((x) => x.id === e.target.value);
                        if (h) {
                          setForm({ ...form, departmentEn: h.nameEn, departmentAr: h.nameAr });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
                    >
                      <option value="">{isAr ? "— اختر مستشفى من الشبكة أو اكتب القسم —" : "— Select registered hospital —"}</option>
                      {hospitals.map((h) => (
                        <option key={h.id} value={h.id}>
                          {isAr ? h.nameAr : h.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "المستشفى / القسم (EN)" : "Hospital / Dept (EN)"}</label>
                  <input
                    value={form.departmentEn}
                    onChange={(e) => setForm({ ...form, departmentEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "المستشفى / القسم (AR)" : "Hospital / Dept (AR)"}</label>
                  <input
                    value={form.departmentAr}
                    onChange={(e) => setForm({ ...form, departmentAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
                  />
                </div>
              </>
            )}

            {form.targetType === "LAB" && (
              <>
                {labs.length > 0 && (
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">
                      {isAr ? "المعمل المستقبِل بالجمهورية" : "Target Registered Laboratory"}
                    </label>
                    <select
                      onChange={(e) => {
                        const l = labs.find((x) => x.id === e.target.value);
                        if (l) {
                          setForm({ ...form, departmentEn: l.nameEn, departmentAr: l.nameAr });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
                    >
                      <option value="">{isAr ? "— اختر المعمل المطلوب التحويل إليه —" : "— Select registered laboratory —"}</option>
                      {labs.map((l) => (
                        <option key={l.id} value={l.id}>
                          {isAr ? l.nameAr : l.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "الفحص المعملي المطلوب" : "Test Panel"}</label>
                  <select
                    value={form.testPanel}
                    onChange={(e) => setForm({ ...form, testPanel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
                  >
                    <option value="CBC">Complete Blood Count (CBC)</option>
                    <option value="HBA1C">HbA1c (السكر التراكمي)</option>
                    <option value="LIPID">Lipid Profile (دهون الدم)</option>
                    <option value="LFT">Liver Function (وظائف كبد)</option>
                    <option value="RFT">Renal Function (وظائف كلى)</option>
                  </select>
                </div>
              </>
            )}

            <div className="md:col-span-3">
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "الملاحظات الإكلينيكية للتحويل" : "Clinical Referral Notes"}</label>
              <input
                value={isAr ? form.clinicalNoteAr : form.clinicalNoteEn}
                onChange={(e) => setForm({ ...form, clinicalNoteAr: e.target.value, clinicalNoteEn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-outline-variant/40 text-xs">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold">
                {isAr ? "إرسال التحويل" : "Submit Referral"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {conditionFlags.length > 0 && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4" />
              {isAr ? "تنبيهات المعمل الإكلينيكية بانتظار اعتماد الطبيب (للملف الطبي وبطاقة الطوارئ)" : "Lab Clinical Condition Flags (Awaiting Physician Approval)"}
            </h3>
            <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
              {conditionFlags.filter((f) => f.status === "PENDING").length} {isAr ? "قيد المراجعة" : "Pending"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {conditionFlags.slice(0, 6).map((fl) => (
              <div key={fl.id} className="flex items-center justify-between gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-on-surface">
                      {fl.patient ? (isAr ? fl.patient.fullNameAr : fl.patient.fullNameEn) : fl.patientId}
                    </span>
                    <span className="font-mono text-[11px] text-primary">{fl.patient?.mti}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${fl.conditionType === "ALLERGY" ? "bg-red-500/15 text-red-700" : "bg-amber-500/15 text-amber-700"}`}>
                      {fl.conditionType === "ALLERGY" ? (isAr ? "حساسية" : "Allergy") : (isAr ? "مرض مزمن" : "Chronic")}
                    </span>
                  </div>
                  <p className="font-semibold text-on-surface mt-0.5">
                    {isAr ? fl.conditionAr : fl.conditionEn}
                  </p>
                  {fl.flaggedBy && (
                    <p className="text-[11px] text-on-surface-variant">
                      {isAr ? "مرفوع من:" : "Flagged by:"} {isAr ? fl.flaggedBy.fullNameAr : fl.flaggedBy.fullNameEn}
                    </p>
                  )}
                </div>
                {fl.status === "PENDING" ? (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleReviewFlag(fl.id, "APPROVED")}
                      className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold hover:opacity-90"
                    >
                      {isAr ? "اعتماد وإضافة" : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReviewFlag(fl.id, "REJECTED")}
                      className="px-2.5 py-1 rounded bg-red-600/15 text-red-700 font-semibold hover:bg-red-600/25"
                    >
                      {isAr ? "رفض" : "Reject"}
                    </button>
                  </div>
                ) : (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${fl.status === "APPROVED" ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"}`}>
                    {fl.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {["ALL", "HOSPITAL", "LAB", "PHARMACY"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTarget(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTarget === t ? "bg-primary text-on-primary" : "border border-outline-variant/40 hover:bg-surface-container-low"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={load} className="px-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          {isAr ? "تحديث" : "Refresh"}
        </button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-on-surface-variant">{isAr ? "جاري تحميل التحويلات..." : "Loading referrals..."}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-on-surface-variant">
            <Send className="w-10 h-10 mx-auto mb-2 opacity-30" />
            {isAr ? "لا توجد تحويلات طبية مسجلة." : "No referrals found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-xs text-on-surface-variant">
                <tr>
                  <th className="p-3 text-start">{isAr ? "المريض" : "Patient"}</th>
                  <th className="p-3 text-start">{isAr ? "الجهة" : "Target"}</th>
                  <th className="p-3 text-start">{isAr ? "التفاصيل" : "Details"}</th>
                  <th className="p-3 text-start">{isAr ? "الأولوية" : "Urgency"}</th>
                  <th className="p-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                  <th className="p-3 text-end">{isAr ? "إجراء" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/40">
                    <td className="p-3">
                      <div className="font-semibold">{r.patient ? (isAr ? r.patient.fullNameAr : r.patient.fullNameEn) : "—"}</div>
                      <div className="text-xs font-mono text-on-surface-variant">{r.patient?.mti}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-surface-container-low font-mono text-xs font-bold">{r.targetType}</span>
                    </td>
                    <td className="p-3 text-xs">
                      <div className="font-semibold">
                        {r.targetType === "HOSPITAL" ? (isAr ? r.departmentAr : r.departmentEn) : r.targetType === "LAB" ? r.testPanel : (isAr ? r.medicationAr : r.medicationEn)}
                      </div>
                      <div className="text-on-surface-variant">{isAr ? r.clinicalNoteAr : r.clinicalNoteEn}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.urgency === "CRITICAL" ? "bg-red-500/10 text-red-600" : "bg-blue-500/10 text-blue-600"}`}>
                        {r.urgency}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        r.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600" :
                        r.status === "ACCEPTED" ? "bg-blue-500/10 text-blue-600" :
                        "bg-amber-500/10 text-amber-600"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-end space-x-1 rtl:space-x-reverse">
                      {canActOnIncoming && r.status === "PENDING" && (
                        <button
                          onClick={() => handleAction(r.id, "ACCEPTED")}
                          className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-semibold"
                        >
                          {isAr ? "قبول" : "Accept"}
                        </button>
                      )}
                      {canActOnIncoming && (r.status === "PENDING" || r.status === "ACCEPTED") && (
                        <button
                          onClick={() => handleAction(r.id, "COMPLETED")}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold"
                        >
                          {isAr ? "إتمام" : "Complete"}
                        </button>
                      )}
                      {!canActOnIncoming && r.status === "PENDING" && (
                        <button
                          onClick={() => handleCancel(r.id)}
                          className="px-2.5 py-1 rounded border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-500/20"
                        >
                          {isAr ? "إلغاء الإحالة" : "Cancel"}
                        </button>
                      )}
                      {!canActOnIncoming && r.status !== "PENDING" && (
                        <span className="text-xs text-on-surface-variant">
                          {isAr ? "تُدار من الجهة المستقبِلة" : "Managed by Receiver"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
