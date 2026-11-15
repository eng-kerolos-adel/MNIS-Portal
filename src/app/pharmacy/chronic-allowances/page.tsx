"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pick as pickBilingual } from "@/lib/utils/format";
import { api, patientId } from "@/lib/data/service";
import type { Bilingual, NationalIdentity } from "@/types/domain";
import { HeartPulse, Search, CheckCircle2, AlertTriangle, PackagePlus, RefreshCw } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ChronicAllowancesPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const pick = (v: Bilingual) => pickBilingual(v, locale);
  const searchParams = useSearchParams();
  const urlPatientId = searchParams.get("patientId");

  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<NationalIdentity[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<NationalIdentity | null>(null);
  const [allowances, setAllowances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispenseQty, setDispenseQty] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const searchPatients = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const list = await api.searchPatients(query);
      setPatients(list);
      if (urlPatientId) {
        const matched = list.find((p) => patientId(p) === urlPatientId);
        if (matched) {
          await selectPatient(matched);
          return;
        }
      }
      if (list.length > 0 && !selectedPatient) {
        await selectPatient(list[0]!);
      }
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to search patients" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void searchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectPatient = async (p: NationalIdentity) => {
    setSelectedPatient(p);
    setLoading(true);
    try {
      const pid = patientId(p);
      const list = await api.getChronicAllowances(pid);
      setAllowances(list);
      const initQty: Record<string, number> = {};
      list.forEach((a: any) => { initQty[a.id] = 1; });
      setDispenseQty(initQty);
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to load chronic allowances" });
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (a: any) => {
    const qty = Number(dispenseQty[a.id] ?? 1);
    if (qty <= 0) return;
    setBusyId(a.id);
    setToast(null);
    try {
      await api.dispenseAllowance(a.id, qty);
      setToast({
        type: "ok",
        msg: isAr ? `تم صرف ${qty} وحدة من ${a.medicationAr || a.medicationEn} بنجاح` : `Dispensed ${qty} unit(s) of ${a.medicationEn}`,
      });
      if (selectedPatient) await selectPatient(selectedPatient);
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Dispensing failed" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={HeartPulse}
        title={isAr ? "إدارة وصرف حصص الأدوية المزمنة" : "Chronic Medication Allowances"}
        meta={
          isAr
            ? "متابعة الحصص الشهرية للمرضى أصحاب الأمراض المزمنة وصرف الأدوية المقررة آلياً مع خصم الرصيد الشهري"
            : "Track monthly medication quotas for chronic disease patients and dispense scheduled refills with real-time quota deduction"
        }
      />

      {toast && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${toast.type === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            {isAr ? "البحث عن مواطن (MTI أو الاسم)" : "Find Citizen (MTI or Name)"}
          </h3>
          <form onSubmit={searchPatients} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAr ? "مثال: EG-2990... أو اسم المريض" : "e.g. EG-2990... or patient name"}
              className="flex-1 px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90"
            >
              {isAr ? "بحث" : "Search"}
            </button>
          </form>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {patients.map((p) => {
              const active = selectedPatient?.mti === p.mti;
              return (
                <button
                  key={p.mti}
                  onClick={() => selectPatient(p)}
                  className={`w-full text-start p-3 rounded-xl border transition-all ${
                    active ? "border-primary bg-primary/10" : "border-outline-variant/40 hover:bg-surface-container-low"
                  }`}
                >
                  <div className="font-bold text-sm">{pick(p.fullName)}</div>
                  <div className="text-xs text-on-surface-variant font-mono mt-0.5">{p.mti}</div>
                  {p.chronicConditions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.chronicConditions.map((c, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {pick(c)}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
            {patients.length === 0 && !loading && (
              <p className="text-xs text-on-surface-variant text-center py-6">
                {isAr ? "ابحث عن مريض لعرض حصصه الشهرية من الأدوية المزمنة" : "Search for a citizen to view their monthly chronic medication quotas"}
              </p>
            )}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {selectedPatient ? (
            <>
              <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-on-surface-variant">{isAr ? "المريض المحدد" : "Selected Citizen"}</div>
                  <h2 className="text-lg font-bold">{pick(selectedPatient.fullName)}</h2>
                  <div className="text-xs font-mono text-primary">{selectedPatient.mti} · {selectedPatient.bloodType}</div>
                </div>
                <button
                  onClick={() => selectPatient(selectedPatient)}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs flex items-center gap-1.5 hover:bg-surface-container-low"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {isAr ? "تحديث الحصص" : "Refresh Quotas"}
                </button>
              </Card>

              {allowances.length === 0 ? (
                <Card className="p-10 text-center text-on-surface-variant">
                  <HeartPulse className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">
                    {isAr ? "لا توجد حصص أدوية مزمنة مسجلة لهذا المريض حالياً." : "No chronic medication allowances found for this patient."}
                  </p>
                  <p className="text-xs mt-1">
                    {isAr
                      ? "يتم إنشاء الحصة تلقائياً عند توقيع الطبيب لروشتة تحتوي على دواء مزمن أو لمدة 30 يوماً فأكثر."
                      : "Allowances are automatically created when a doctor signs a chronic or 30+ day prescription."}
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allowances.map((a) => {
                    const limit = a.monthlyLimit || 1;
                    const used = a.consumedThisMonth || 0;
                    const remaining = Math.max(0, limit - used);
                    const pct = Math.min(100, Math.round((used / limit) * 100));
                    return (
                      <Card key={a.id} className="p-5 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-base">{isAr ? a.medicationAr || a.medicationEn : a.medicationEn}</h4>
                              <p className="text-xs text-on-surface-variant">{a.dose}</p>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${remaining > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                              {remaining > 0 ? (isAr ? `متاح: ${remaining}` : `${remaining} left`) : (isAr ? "مكتمل" : "Exhausted")}
                            </span>
                          </div>

                          <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-on-surface-variant">{isAr ? "المستهلك هذا الشهر" : "Consumed this month"}</span>
                              <span className="font-mono font-bold">{used} / {limit}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-surface-container-low overflow-hidden">
                              <div
                                className={`h-full transition-all ${pct >= 100 ? "bg-red-500" : "bg-primary"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="text-[11px] text-on-surface-variant">
                              {isAr ? "تاريخ التجديد القادم: " : "Next Reset: "}
                              <span className="font-mono">{new Date(a.resetDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-outline-variant/40 flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={Math.max(1, remaining)}
                            disabled={remaining === 0 || busyId === a.id}
                            value={dispenseQty[a.id] ?? 1}
                            onChange={(e) => setDispenseQty({ ...dispenseQty, [a.id]: Number(e.target.value) })}
                            className="w-20 px-2.5 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
                          />
                          <button
                            onClick={() => handleDispense(a)}
                            disabled={remaining === 0 || busyId === a.id}
                            className="flex-1 py-2 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                          >
                            <PackagePlus className="w-4 h-4" />
                            {busyId === a.id ? (isAr ? "جاري الصرف..." : "Dispensing...") : (isAr ? "صرف من الحصة" : "Dispense Quota")}
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <Card className="p-12 text-center text-on-surface-variant">
              <HeartPulse className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <h3 className="font-bold text-base text-on-surface">
                {isAr ? "اختر مريضاً من القائمة الجانبية" : "Select a Citizen from the Search Panel"}
              </h3>
              <p className="text-xs mt-1">
                {isAr ? "اضغط على زر البحث لعرض المرضى المسجلين وفحص حصص الأدوية المزمنة الخاصة بهم" : "Click Search to list registered citizens and inspect their monthly chronic medication allowances"}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
