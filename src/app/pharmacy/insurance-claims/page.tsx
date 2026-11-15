"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pick as pickBilingual } from "@/lib/utils/format";
import { api, rxCode } from "@/lib/data/service";
import type { Bilingual, Prescription } from "@/types/domain";
import { ReceiptText, Send, PlusCircle, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function InsuranceClaimsPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const pick = (v: Bilingual) => pickBilingual(v, locale);

  const [claims, setClaims] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedRxId, setSelectedRxId] = useState("");
  const [coveragePct, setCoveragePct] = useState(80);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cList, rxList] = await Promise.all([api.getPharmacyClaims(), api.getPrescriptions()]);
      setClaims(cList);
      const claimedRxIds = new Set(cList.map((c: any) => c.prescriptionId));
      const unclamedRx = rxList.filter((r) => !claimedRxIds.has(r.id));
      setPrescriptions(unclamedRx);
      if (unclamedRx.length > 0 && !selectedRxId) {
        setSelectedRxId(unclamedRx[0]!.id);
      }
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to load insurance claims" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRxId) return;
    setBusyId("create");
    setToast(null);
    try {
      await api.createPharmacyClaim({ prescriptionId: selectedRxId, coveragePct });
      setToast({
        type: "ok",
        msg: isAr ? "تم إنشاء مطالبة التأمين الصحي بنجاح" : "Insurance claim created successfully",
      });
      setSelectedRxId("");
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to create claim" });
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmitClaim = async (id: string) => {
    setBusyId(id);
    setToast(null);
    try {
      await api.submitClaim(id);
      setToast({
        type: "ok",
        msg: isAr ? "تم إرسال المطالبة لهيئة التأمين الصحي الشامل للمراجعة والتسوية" : "Claim submitted to UHIA for settlement",
      });
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to submit claim" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={ReceiptText}
        title={isAr ? "إدارة ومراجعة المطالبات التأمينية للروشتات" : "Pharmacy Insurance Claims Management"}
        meta={
          isAr
            ? "متابعة المطالبات المالية الناتجة عن صرف الروشتات الإلكترونية وإرسالها للتسوية مع التأمين الصحي الشامل"
            : "Track financial claims generated from dispensed e-prescriptions and submit them to UHIA for reimbursement"
        }
      />

      {toast && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${toast.type === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {prescriptions.length > 0 && (
        <Card className="p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-primary" />
            {isAr ? "إنشاء مطالبة تأمينية لروشتة غير مسجلة" : "Create Insurance Claim for Unclaimed Prescription"}
          </h3>
          <form onSubmit={handleCreateClaim} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "الروشتة" : "Prescription"}</label>
              <select
                value={selectedRxId}
                onChange={(e) => setSelectedRxId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
              >
                {prescriptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    #{rxCode(r)} — {pick(r.patient.fullName)} ({pick(r.diagnosis)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{isAr ? "نسبة التغطية التأمينية (%)" : "Coverage (%)"}</label>
              <input
                type="number"
                min={0}
                max={100}
                value={coveragePct}
                onChange={(e) => setCoveragePct(Number(e.target.value))}
                className="w-28 px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={busyId === "create"}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90"
            >
              {busyId === "create" ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إضافة مطالبة" : "Create Claim")}
            </button>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-outline-variant/40 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-primary" />
            {isAr ? "قائمة المطالبات التأمينية" : "Insurance Claims Ledger"} ({claims.length})
          </h3>
          <button
            onClick={load}
            className="px-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs flex items-center gap-1.5 hover:bg-surface-container-low"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {isAr ? "تحديث" : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-on-surface-variant">{isAr ? "جاري تحميل المطالبات..." : "Loading claims..."}</div>
        ) : claims.length === 0 ? (
          <div className="p-10 text-center text-sm text-on-surface-variant">
            {isAr ? "لا توجد مطالبات مسجلة حتى الآن. يتم إنشاء المطالبة تلقائياً عند صرف أي روشتة." : "No claims found. Claims are automatically created when prescriptions are dispensed."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-xs text-on-surface-variant">
                <tr>
                  <th className="p-3 text-start">{isAr ? "المريض" : "Citizen"}</th>
                  <th className="p-3 text-start">{isAr ? "التشخيص" : "Diagnosis"}</th>
                  <th className="p-3 text-start">{isAr ? "الإجمالي" : "Total (EGP)"}</th>
                  <th className="p-3 text-start">{isAr ? "حصة التأمين" : "Insurance Share"}</th>
                  <th className="p-3 text-start">{isAr ? "حصة المواطن" : "Citizen Copay"}</th>
                  <th className="p-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                  <th className="p-3 text-end">{isAr ? "إجراء" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {claims.map((c) => {
                  const p = c.prescription?.patient;
                  return (
                    <tr key={c.id} className="hover:bg-surface-container-low/40">
                      <td className="p-3">
                        <div className="font-semibold">{p ? (isAr ? p.fullNameAr : p.fullNameEn) : "—"}</div>
                        <div className="text-xs font-mono text-on-surface-variant">{p?.mti}</div>
                      </td>
                      <td className="p-3 text-xs">
                        {c.prescription ? (isAr ? c.prescription.diagnosisAr : c.prescription.diagnosisEn) : "—"}
                      </td>
                      <td className="p-3 font-mono font-bold">{Number(c.totalAmountEgp).toFixed(2)}</td>
                      <td className="p-3 font-mono text-emerald-600 font-semibold">
                        {Number(c.insuranceCoverEgp).toFixed(2)} ({c.coveragePct}%)
                      </td>
                      <td className="p-3 font-mono">{Number(c.patientCopayEgp).toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-600" :
                          c.status === "SUBMITTED" ? "bg-blue-500/10 text-blue-600" :
                          c.status === "REJECTED" ? "bg-red-500/10 text-red-600" :
                          "bg-amber-500/10 text-amber-600"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-end">
                        {c.status === "PENDING" && (
                          <button
                            onClick={() => handleSubmitClaim(c.id)}
                            disabled={busyId === c.id}
                            className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold inline-flex items-center gap-1 hover:opacity-90"
                          >
                            <Send className="w-3 h-3" />
                            {busyId === c.id ? "..." : (isAr ? "إرسال للتأمين" : "Submit to UHIA")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
