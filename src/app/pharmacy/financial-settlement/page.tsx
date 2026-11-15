"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { api } from "@/lib/data/service";
import { Wallet, PlayCircle, CheckCircle2, FileSpreadsheet, AlertTriangle, RefreshCw } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function FinancialSettlementPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getPharmacySettlements();
      setSettlements(data);
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to load settlements" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const runBatch = async () => {
    setRunning(true);
    setToast(null);
    try {
      const res = await api.runPharmacySettlement(year, month);
      setToast({
        type: "ok",
        msg: isAr
          ? `تمت التسوية المالية لشهر ${month}/${year} بنجاح — إجمالي التغطية التأمينية: ${Number(res.totalInsuranceEgp ?? 0).toLocaleString()} ج.م`
          : `Financial settlement for ${month}/${year} completed — Insurance Total: EGP ${Number(res.totalInsuranceEgp ?? 0).toLocaleString()}`,
      });
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to run monthly settlement" });
    } finally {
      setRunning(false);
    }
  };

  const totalDisbursed = settlements.reduce((sum, s) => sum + Number(s.totalInsuranceEgp || 0), 0);
  const totalClaims = settlements.reduce((sum, s) => sum + Number(s.totalClaims || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Wallet}
        title={isAr ? "التسويات المالية الشهرية للمطالبات الدوائية" : "Monthly Pharmacy Financial Settlements"}
        meta={
          isAr
            ? "تجميع المطالبات المقدمة للهيئة العامة للتأمين الصحي الشامل وإصدار دفعات التسوية الشهرية المعتمدة"
            : "Batch submitted pharmacy insurance claims into audited monthly UHIA financial settlement ledgers"
        }
      />

      {toast && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${toast.type === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs text-on-surface-variant">{isAr ? "إجمالي الدفعات المسواة" : "Total Settled Batches"}</div>
          <div className="text-2xl font-bold mt-1 font-mono">{settlements.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-on-surface-variant">{isAr ? "إجمالي المطالبات المعتمدة" : "Total Approved Claims"}</div>
          <div className="text-2xl font-bold mt-1 font-mono text-primary">{totalClaims.toLocaleString()}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs text-on-surface-variant">{isAr ? "إجمالي المبالغ المسددة من التأمين" : "Total UHIA Insurance Payout"}</div>
          <div className="text-2xl font-bold mt-1 font-mono text-emerald-600">{totalDisbursed.toLocaleString()} EGP</div>
        </Card>
      </div>

      <Card className="p-5 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? "السنة المالية" : "Fiscal Year"}</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono w-28"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{isAr ? "الشهر" : "Month"}</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono w-32"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button
            onClick={runBatch}
            disabled={running}
            className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" />
            {running ? (isAr ? "جاري تشغيل التسوية..." : "Running Batch...") : (isAr ? "تشغيل دورة التسوية الشهرية" : "Run Monthly Settlement")}
          </button>
        </div>

        <button
          onClick={load}
          className="px-3 py-2 rounded-lg border border-outline-variant/40 text-xs flex items-center gap-1.5 hover:bg-surface-container-low"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {isAr ? "تحديث السجل" : "Refresh"}
        </button>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-outline-variant/40 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            {isAr ? "سجل دفعات التسوية المالية المعتمدة" : "Audited Monthly Settlement Batches"}
          </h3>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-on-surface-variant">{isAr ? "جاري التحميل..." : "Loading settlements..."}</div>
        ) : settlements.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant">
            <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{isAr ? "لا توجد دفعات تسوية سابقة. قم بتشغيل دورة التسوية الشهرية أعلاه." : "No settlement batches yet. Run a monthly settlement batch above."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-xs text-on-surface-variant">
                <tr>
                  <th className="p-3 text-start">{isAr ? "الفترة (شهر/سنة)" : "Period"}</th>
                  <th className="p-3 text-start">{isAr ? "عدد المطالبات" : "Claims Count"}</th>
                  <th className="p-3 text-start">{isAr ? "إجمالي تغطية التأمين (ج.م)" : "Insurance Total (EGP)"}</th>
                  <th className="p-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                  <th className="p-3 text-start">{isAr ? "تاريخ التسوية" : "Settled At"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-low/50">
                    <td className="p-3 font-mono font-bold">{s.month} / {s.year}</td>
                    <td className="p-3 font-mono">{s.totalClaims}</td>
                    <td className="p-3 font-mono font-semibold text-emerald-600">{Number(s.totalInsuranceEgp || 0).toLocaleString()} EGP</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-on-surface-variant">
                      {s.settledAt ? new Date(s.settledAt).toLocaleString() : "—"}
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
