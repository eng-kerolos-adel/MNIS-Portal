"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pick as pickBilingual } from "@/lib/utils/format";
import { api, patientId } from "@/lib/data/service";
import type { Bilingual, NationalIdentity } from "@/types/domain";
import { Scissors, PlusCircle, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function SurgicalSchedulePage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const pick = (v: Bilingual) => pickBilingual(v, locale);

  const [cases, setCases] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<NationalIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    surgeonId: "",
    theaterCode: "OR-01",
    procedureEn: "Laparoscopic Cholecystectomy",
    procedureAr: "استئصال المرارة بالمنظار الجراحي",
    scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    estimatedMins: 90,
  });
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [orList, docList, patList] = await Promise.all([
        api.getOrCases(),
        api.getDoctors(),
        api.searchPatients(""),
      ]);
      setCases(orList);
      setDoctors(docList);
      setPatients(patList);
      if (patList.length > 0 && !form.patientId) {
        setForm((f) => ({ ...f, patientId: patientId(patList[0]!), surgeonId: docList[0]?.id ?? "" }));
      }
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to load surgical schedule" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createOrCase({
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      setToast({ type: "ok", msg: isAr ? "تمت جدولة العملية الجراحية بنجاح" : "Surgical procedure scheduled" });
      setShowAdd(false);
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to schedule surgery" });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateOrCase(id, { status });
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to update OR status" });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Scissors}
        title={isAr ? "جدول العمليات الجراحية وإدارة غرف العمليات" : "Surgical Operations & OR Theater Schedule"}
        meta={
          isAr
            ? "متابعة العمليات الجراحية المجدولة والجارية وتسكين الجراحين وغرف العمليات في الوقت الفعلي"
            : "Coordinate operating theater schedules, surgical teams, and live procedure statuses"
        }
        actions={
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            {isAr ? "جدولة عملية جراحية" : "Schedule Surgery"}
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
          <h3 className="font-bold text-sm mb-4">{isAr ? "حجز غرفة عمليات" : "Schedule New OR Procedure"}</h3>
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
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "الجراح المسؤول" : "Lead Surgeon"}</label>
              <select
                value={form.surgeonId}
                onChange={(e) => setForm({ ...form, surgeonId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {isAr ? d.fullNameAr : d.fullNameEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "غرفة العمليات" : "Operating Theater"}</label>
              <select
                value={form.theaterCode}
                onChange={(e) => setForm({ ...form, theaterCode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
              >
                <option value="OR-01">OR-01 (Main Surgery)</option>
                <option value="OR-02">OR-02 (Cardiothoracic)</option>
                <option value="OR-03">OR-03 (Orthopedic / Trauma)</option>
                <option value="OR-04">OR-04 (Emergency OR)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "الإجراء الجراحي (EN)" : "Procedure (EN)"}</label>
              <input
                required
                value={form.procedureEn}
                onChange={(e) => setForm({ ...form, procedureEn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "الإجراء الجراحي (AR)" : "Procedure (AR)"}</label>
              <input
                required
                value={form.procedureAr}
                onChange={(e) => setForm({ ...form, procedureAr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "الموعد المحدد" : "Scheduled Time"}</label>
              <input
                type="datetime-local"
                required
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-outline-variant/40 text-xs">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold">
                {isAr ? "تأكيد الحجز" : "Confirm OR Booking"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-outline-variant/40 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Scissors className="w-4 h-4 text-primary" />
            {isAr ? "قائمة العمليات الجراحية" : "Operating Room Cases"} ({cases.length})
          </h3>
          <button onClick={load} className="px-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            {isAr ? "تحديث" : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-on-surface-variant">{isAr ? "جاري التحميل..." : "Loading OR schedule..."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-xs text-on-surface-variant">
                <tr>
                  <th className="p-3 text-start">{isAr ? "الغرفة" : "Theater"}</th>
                  <th className="p-3 text-start">{isAr ? "المريض" : "Patient"}</th>
                  <th className="p-3 text-start">{isAr ? "العملية الجراحية" : "Procedure"}</th>
                  <th className="p-3 text-start">{isAr ? "الجراح" : "Surgeon"}</th>
                  <th className="p-3 text-start">{isAr ? "الموعد" : "Scheduled"}</th>
                  <th className="p-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                  <th className="p-3 text-end">{isAr ? "تحديث الحالة" : "Update Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low/40">
                    <td className="p-3 font-mono font-bold text-primary">{c.theaterCode}</td>
                    <td className="p-3">
                      <div className="font-semibold">{c.patient ? (isAr ? c.patient.fullNameAr : c.patient.fullNameEn) : "—"}</div>
                      <div className="text-xs font-mono text-on-surface-variant">{c.patient?.mti}</div>
                    </td>
                    <td className="p-3 font-medium">{isAr ? c.procedureAr : c.procedureEn}</td>
                    <td className="p-3 text-xs">{c.surgeon ? (isAr ? c.surgeon.fullNameAr : c.surgeon.fullNameEn) : "—"}</td>
                    <td className="p-3 font-mono text-xs">{new Date(c.scheduledAt).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        c.status === "IN_PROGRESS" ? "bg-amber-500/10 text-amber-600" :
                        c.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600" :
                        c.status === "POSTPONED" ? "bg-red-500/10 text-red-600" :
                        "bg-blue-500/10 text-blue-600"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-end space-x-1 rtl:space-x-reverse">
                      {c.status === "SCHEDULED" && (
                        <button
                          onClick={() => updateStatus(c.id, "IN_PROGRESS")}
                          className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 text-xs font-semibold"
                        >
                          {isAr ? "بدء العملية" : "Start OR"}
                        </button>
                      )}
                      {c.status === "IN_PROGRESS" && (
                        <button
                          onClick={() => updateStatus(c.id, "COMPLETED")}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold"
                        >
                          {isAr ? "إتمام العملية" : "Complete"}
                        </button>
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
