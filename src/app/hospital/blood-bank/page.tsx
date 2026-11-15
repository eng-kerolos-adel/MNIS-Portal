"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { api } from "@/lib/data/service";
import { Droplets, PlusCircle, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function BloodBankPage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    bagBarcode: "",
    bloodType: "O+",
    component: "PACKED_RBC",
    volumeMl: 450,
    expiresAt: new Date(Date.now() + 35 * 86400000).toISOString().slice(0, 10),
  });
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.getBloodBank();
      setUnits(list);
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to load blood bank inventory" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBloodUnit({
        ...form,
        bagBarcode: form.bagBarcode || `BB-${Date.now().toString().slice(-6)}`,
      });
      setToast({ type: "ok", msg: isAr ? "تمت إضافة وحدة الدم للمخزون الاستراتيجي بنجاح" : "Blood unit added to inventory" });
      setShowAdd(false);
      setForm({ ...form, bagBarcode: "" });
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to add blood unit" });
    }
  };

  const changeStatus = async (id: string, status: string) => {
    try {
      await api.updateBloodUnit(id, { status });
      await load();
    } catch (err: any) {
      setToast({ type: "err", msg: err?.message ?? "Failed to update unit status" });
    }
  };

  const availableByGroup = BLOOD_TYPES.map((bt) => ({
    bloodType: bt,
    count: units.filter((u) => u.bloodType === bt && u.status === "AVAILABLE").length,
  }));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Droplets}
        title={isAr ? "إدارة مخزون وفصائل بنك الدم" : "Blood Bank & Plasma Reserve Management"}
        meta={
          isAr
            ? "متابعة الأرصدة الحية لأكياس الدم والبلازما والصفائح الدموية حسب الفصيلة وصرفها الفوري للطوارئ والعمليات"
            : "Real-time tracking of Packed RBCs, Plasma, and Platelets across all blood groups for ER and surgical dispatch"
        }
        actions={
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            {isAr ? "تسجيل كيس دم جديد" : "Register Blood Bag"}
          </button>
        }
      />

      {toast && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${toast.type === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {availableByGroup.map((g) => (
          <Card key={g.bloodType} className="p-4 text-center">
            <div className="text-lg font-black font-mono text-red-600 flex items-center justify-center gap-1">
              <Droplets className="w-4 h-4" />
              {g.bloodType}
            </div>
            <div className="text-2xl font-bold font-mono mt-1">{g.count}</div>
            <div className="text-[10px] text-on-surface-variant">{isAr ? "كيس متاح" : "Available"}</div>
          </Card>
        ))}
      </div>

      {showAdd && (
        <Card className="p-5">
          <h3 className="font-bold text-sm mb-3">{isAr ? "إضافة وحدة دم جديدة للمخزون" : "Add New Blood Bag to Reserve"}</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              placeholder={isAr ? "باركود الكيس (اختياري)" : "Bag Barcode (optional)"}
              value={form.bagBarcode}
              onChange={(e) => setForm({ ...form, bagBarcode: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
            />
            <select
              value={form.bloodType}
              onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
            >
              {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
            </select>
            <select
              value={form.component}
              onChange={(e) => setForm({ ...form, component: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm"
            >
              <option value="PACKED_RBC">Packed RBCs (كرات دم حمراء)</option>
              <option value="PLASMA">Fresh Frozen Plasma (بلازما)</option>
              <option value="PLATELETS">Platelets (صفائح دموية)</option>
              <option value="WHOLE_BLOOD">Whole Blood (دم كامل)</option>
            </select>
            <input
              type="number"
              value={form.volumeMl}
              onChange={(e) => setForm({ ...form, volumeMl: Number(e.target.value) })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
            />
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-sm font-mono"
            />
            <div className="md:col-span-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-outline-variant/40 text-xs">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold">
                {isAr ? "حفظ الوحدة" : "Save Blood Unit"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-outline-variant/40 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Droplets className="w-4 h-4 text-red-500" />
            {isAr ? "سجل وحدات الدم" : "Blood Units Registry"} ({units.length})
          </h3>
          <button onClick={load} className="px-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            {isAr ? "تحديث" : "Refresh"}
          </button>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-on-surface-variant">{isAr ? "جاري التحميل..." : "Loading blood units..."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-xs text-on-surface-variant">
                <tr>
                  <th className="p-3 text-start">{isAr ? "باركود الكيس" : "Barcode"}</th>
                  <th className="p-3 text-start">{isAr ? "الفصيلة" : "Group"}</th>
                  <th className="p-3 text-start">{isAr ? "المكون" : "Component"}</th>
                  <th className="p-3 text-start">{isAr ? "الحجم" : "Volume"}</th>
                  <th className="p-3 text-start">{isAr ? "الصلاحية" : "Expires"}</th>
                  <th className="p-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                  <th className="p-3 text-end">{isAr ? "إجراء" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/40">
                    <td className="p-3 font-mono text-xs font-bold">{u.bagBarcode}</td>
                    <td className="p-3 font-mono font-black text-red-600">{u.bloodType}</td>
                    <td className="p-3 text-xs">{u.component}</td>
                    <td className="p-3 font-mono text-xs">{u.volumeMl} mL</td>
                    <td className="p-3 font-mono text-xs">{new Date(u.expiresAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.status === "AVAILABLE" ? "bg-emerald-500/10 text-emerald-600" :
                        u.status === "RESERVED" ? "bg-amber-500/10 text-amber-600" :
                        u.status === "USED" ? "bg-blue-500/10 text-blue-600" :
                        "bg-red-500/10 text-red-600"
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-end space-x-1 rtl:space-x-reverse">
                      {u.status === "AVAILABLE" && (
                        <button
                          onClick={() => changeStatus(u.id, "RESERVED")}
                          className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 text-xs font-semibold hover:bg-amber-500/20"
                        >
                          {isAr ? "حجز لمريض" : "Reserve"}
                        </button>
                      )}
                      {(u.status === "AVAILABLE" || u.status === "RESERVED") && (
                        <button
                          onClick={() => changeStatus(u.id, "USED")}
                          className="px-2.5 py-1 rounded bg-primary text-on-primary text-xs font-semibold hover:opacity-90"
                        >
                          {isAr ? "صرف طارئ" : "Dispense"}
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
