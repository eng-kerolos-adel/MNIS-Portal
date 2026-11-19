"use client";

import { useEffect, useState, useCallback } from "react";
import { Package, AlertTriangle, Plus, Minus, RefreshCw } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { pick } from "@/lib/utils/format";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function PharmacyInventoryPage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [addModal, setAddModal] = useState(false);
  const [newDrug, setNewDrug] = useState({
    nameEn: "",
    nameAr: "",
    form: "Tablet",
    dose: "500mg",
    quantity: 120,
    reorderAt: 30,
    unitPrice: 45,
  });

  const load = useCallback(async () => {
    try {
      const res = await api.getPharmacyInventory();
      setItems(res);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [handleError]);
  useEffect(() => {
    void load();
  }, [load]);

  const filtered = items.filter((i) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (i.nameEn ?? "").toLowerCase().includes(q) ||
      (i.nameAr ?? "").toLowerCase().includes(q) ||
      (i.form ?? "").toLowerCase().includes(q) ||
      (i.dose ?? "").toLowerCase().includes(q)
    );
  });

  async function adjustQuantity(drug: any, delta: number) {
    setBusyId(drug.id);
    try {
      const nextQty = Math.max(0, Number(drug.quantity ?? 0) + delta);
      await api.updateDrug(drug.id, { quantity: nextQty });
      push("success", ar ? "تم تحديث رصيد المخزن" : "Inventory stock updated");
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusyId(null);
    }
  }

  async function createDrugItem() {
    if (!newDrug.nameEn.trim() && !newDrug.nameAr.trim()) return;
    setBusyId("create");
    try {
      await api.createDrug({
        nameEn: newDrug.nameEn.trim() || newDrug.nameAr.trim(),
        nameAr: newDrug.nameAr.trim() || newDrug.nameEn.trim(),
        form: newDrug.form,
        dose: newDrug.dose,
        quantity: Number(newDrug.quantity),
        reorderAt: Number(newDrug.reorderAt),
        unitCost: Number(newDrug.unitPrice),
        unitPrice: Number(newDrug.unitPrice),
      });
      push("success", ar ? "تمت إضافة الصنف الدوائي للمخزن" : "Medication added to inventory");
      setAddModal(false);
      setNewDrug({
        nameEn: "",
        nameAr: "",
        form: "Tablet",
        dose: "500mg",
        quantity: 120,
        reorderAt: 30,
        unitPrice: 45,
      });
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={Package}
        title={ar ? "جرد وإدارة مخزن الصيدلية" : "Pharmacy Inventory Management"}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddModal(true)}>
            {ar ? "إضافة صنف دوائي جديد" : "Add Medication"}
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <CardTitle>
            {ar ? "الأرصدة الحالية (تُخصم تلقائياً عند صرف الروشتات)" : "Current Stock (Auto-deducted on Rx Dispense)"}
          </CardTitle>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={ar ? "ابحث باسم الدواء بالعربية أو الإنجليزية..." : "Search medication by name..."}
            className="w-full sm:w-72"
          />
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-center py-4 text-on-surface-variant">
              {ar ? "جاري التحميل..." : "Loading..."}
            </p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-center py-4 text-on-surface-variant">
              {ar ? "لا توجد أصناف مطابقة" : "No matching items"}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {filtered.map((r) => {
              const lowStock = r.quantity <= r.reorderAt;
              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 p-3 border border-outline-variant/40 rounded-lg bg-surface-container-lowest sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-on-surface">
                        {pick({ en: r.nameEn, ar: r.nameAr }, locale)}
                      </p>
                      {r.dose && (
                        <span className="text-xs font-mono bg-surface-container px-1.5 py-0.5 rounded">
                          {r.dose}
                        </span>
                      )}
                      {lowStock && (
                        <Badge tone="error">
                          <AlertTriangle className="h-3 w-3 inline me-1" />
                          {ar ? "رصيد منخفض" : "Low Stock"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {pick({ en: r.formEn ?? r.form, ar: r.formAr ?? r.form }, locale) || "Medicine"}
                      {(r.unitCost ?? r.unitPrice) ? ` • ${r.unitCost ?? r.unitPrice} EGP` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="text-center px-2">
                      <p className="text-[11px] text-on-surface-variant">
                        {ar ? "حد إعادة الطلب" : "Reorder At"}
                      </p>
                      <p className="font-semibold font-mono">{r.reorderAt}</p>
                    </div>
                    <div className="text-center px-2">
                      <p className="text-[11px] text-on-surface-variant">
                        {ar ? "الرصيد الفعلي" : "Stock Qty"}
                      </p>
                      <Badge
                        tone={lowStock ? "error" : "success"}
                        className="text-sm px-2.5 py-1 font-mono"
                      >
                        {r.quantity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === r.id}
                        onClick={() => adjustQuantity(r, -5)}
                        title={ar ? "خصم 5 عبوات" : "Deduct 5"}
                      >
                        <Minus className="h-3.5 w-3.5" /> 5
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === r.id}
                        onClick={() => adjustQuantity(r, 25)}
                        title={ar ? "توريد +25 عبوة" : "Restock +25"}
                      >
                        <Plus className="h-3.5 w-3.5" /> 25
                      </Button>
                      {lowStock && (
                        <Button
                          size="sm"
                          disabled={busyId === r.id}
                          icon={<RefreshCw className="h-3.5 w-3.5" />}
                          onClick={() => adjustQuantity(r, 100)}
                        >
                          {ar ? "توريد فوري (+100)" : "Restock +100"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title={ar ? "إضافة صنف دوائي جديد للمخزن" : "Add New Medication to Inventory"}
      >
        <div className="flex flex-col gap-3">
          <input
            className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none"
            placeholder={ar ? "اسم الدواء (إنجليزي)" : "Drug Name (English)"}
            value={newDrug.nameEn}
            onChange={(e) => setNewDrug({ ...newDrug, nameEn: e.target.value })}
            dir="ltr"
          />
          <input
            className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none"
            placeholder={ar ? "اسم الدواء (عربي)" : "Drug Name (Arabic)"}
            value={newDrug.nameAr}
            onChange={(e) => setNewDrug({ ...newDrug, nameAr: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none"
              placeholder={ar ? "الشكل (Tablet/Vial)" : "Form"}
              value={newDrug.form}
              onChange={(e) => setNewDrug({ ...newDrug, form: e.target.value })}
            />
            <input
              className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none"
              placeholder={ar ? "التركيز (500mg)" : "Dose"}
              value={newDrug.dose}
              onChange={(e) => setNewDrug({ ...newDrug, dose: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-on-surface-variant">{ar ? "الكمية" : "Qty"}</label>
              <input
                type="number"
                className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none"
                value={newDrug.quantity}
                onChange={(e) => setNewDrug({ ...newDrug, quantity: +e.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] text-on-surface-variant">
                {ar ? "حد الطلب" : "Reorder At"}
              </label>
              <input
                type="number"
                className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none"
                value={newDrug.reorderAt}
                onChange={(e) => setNewDrug({ ...newDrug, reorderAt: +e.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] text-on-surface-variant">
                {ar ? "السعر (ج.م)" : "Price (EGP)"}
              </label>
              <input
                type="number"
                className="h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none"
                value={newDrug.unitPrice}
                onChange={(e) => setNewDrug({ ...newDrug, unitPrice: +e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddModal(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button loading={busyId === "create"} onClick={createDrugItem}>
              {ar ? "حفظ وإدراج بالمخزن" : "Save to Inventory"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
