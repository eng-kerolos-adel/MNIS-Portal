"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { api } from "@/lib/data/service";
import { Beaker, PlusCircle, AlertTriangle, CheckCircle2, Minus, Plus, RefreshCw } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function LabReagentsPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [reagents, setReagents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    code: "",
    nameEn: "",
    nameAr: "",
    quantity: 50,
    unit: "kits",
    lowStockAt: 15,
    expiresAt: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
  });
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.getLabReagents();
      setReagents(list);
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to load reagents" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const adjustStock = async (r: any, delta: number) => {
    const nextQty = Math.max(0, Number(r.quantity) + delta);
    try {
      await api.updateLabReagent(r.id, { quantity: nextQty });
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to update stock" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLabReagent(form);
      setToast({ type: "ok", msg: isAr ? "تمت إضافة الكاشف المعملي بنجاح" : "Reagent added to inventory" });
      setShowAdd(false);
      setForm({ ...form, code: "", nameEn: "", nameAr: "" });
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to create reagent" });
    }
  };

  const lowCount = reagents.filter((r) => r.quantity <= r.lowStockAt).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Beaker}
        title={isAr ? "مخزون الكواشف والمحاليل المعملية" : "Lab Reagents & Consumables Inventory"}
        meta={
          isAr
            ? "متابعة أرصدة الكواشف المعملية وتواريخ الصلاحية وتنبيهات الحد الأدنى للمخزون في الوقت الفعلي"
            : "Monitor laboratory reagent stock levels, expiration dates, and automated low-stock alerts in real time"
        }
        actions={
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 hover:opacity-90"
          >
            <PlusCircle className="w-4 h-4" />
            {isAr ? "إضافة كاشف جديد" : "Add Reagent"}
          </button>
        }
      />

      {toast && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${toast.type === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {lowCount > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">
            {isAr ? `تنبيه: يوجد ${lowCount} من الكواشف المعملية وصلت للحد الأدنى للمخزون وتحتاج إلى طلب إمداد فوري.` : `Alert: ${lowCount} reagent(s) are at or below the minimum stock threshold.`}
          </span>
        </div>
      )}

      {showAdd && (
        <Card className="p-5">
          <h3 className="font-bold text-sm mb-4">{isAr ? "تسجيل كاشف معملي جديد" : "Register New Laboratory Reagent"}</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              required
              placeholder={isAr ? "كود الكاشف (مثال: RGT-CBC-01)" : "Reagent Code (e.g. RGT-CBC-01)"}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
            />
            <input
              required
              placeholder={isAr ? "الاسم بالإنجليزية" : "English Name"}
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
            />
            <input
              required
              placeholder={isAr ? "الاسم بالعربية" : "Arabic Name"}
              value={form.nameAr}
              onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
            />
            <input
              type="number"
              required
              placeholder={isAr ? "الكمية" : "Quantity"}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
            />
            <input
              required
              placeholder={isAr ? "الوحدة (kits / mL)" : "Unit (kits / mL)"}
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
            />
            <input
              type="date"
              required
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
            />
            <div className="md:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-outline-variant/40 text-xs">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold">
                {isAr ? "حفظ الكاشف" : "Save Reagent"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-outline-variant/40 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Beaker className="w-4 h-4 text-primary" />
            {isAr ? "قائمة الكواشف المتوفرة" : "Reagents Stock List"} ({reagents.length})
          </h3>
          <button onClick={load} className="px-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            {isAr ? "تحديث" : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-on-surface-variant">{isAr ? "جاري التحميل..." : "Loading reagents..."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-xs text-on-surface-variant">
                <tr>
                  <th className="p-3 text-start">{isAr ? "الكود" : "Code"}</th>
                  <th className="p-3 text-start">{isAr ? "اسم الكاشف" : "Reagent"}</th>
                  <th className="p-3 text-start">{isAr ? "الرصيد الحالي" : "Current Stock"}</th>
                  <th className="p-3 text-start">{isAr ? "حد التنبيه" : "Low Threshold"}</th>
                  <th className="p-3 text-start">{isAr ? "تاريخ الصلاحية" : "Expiry Date"}</th>
                  <th className="p-3 text-end">{isAr ? "تعديل الرصيد" : "Adjust Stock"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {reagents.map((r) => {
                  const isLow = r.quantity <= r.lowStockAt;
                  return (
                    <tr key={r.id} className="hover:bg-surface-container-low/40">
                      <td className="p-3 font-mono text-xs font-bold">{r.code}</td>
                      <td className="p-3 font-semibold">{isAr ? r.nameAr : r.nameEn}</td>
                      <td className="p-3">
                        <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-xs ${isLow ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                          {r.quantity} {r.unit}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-on-surface-variant">{r.lowStockAt} {r.unit}</td>
                      <td className="p-3 font-mono text-xs">{new Date(r.expiresAt).toLocaleDateString()}</td>
                      <td className="p-3 text-end">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => adjustStock(r, -1)}
                            className="p-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low"
                            title={isAr ? "استهلاك وحدة" : "Consume 1 unit"}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => adjustStock(r, 5)}
                            className="p-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low"
                            title={isAr ? "إضافة 5 وحدات" : "Add 5 units"}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
