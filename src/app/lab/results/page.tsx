"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ClipboardCheck, ShieldCheck, AlertTriangle, CheckCircle2, Plus, Trash2, Save, Flag } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api, patientId } from "@/lib/data/service";
import type { LabResultPanel, LabResultRow } from "@/types/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { pick } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const FLAG_TONE: Record<LabResultRow["flag"], "success" | "warning" | "error"> = { normal: "success", low: "warning", high: "warning", critical: "error" };
const FLAG_LABEL: Record<LabResultRow["flag"], { en: string; ar: string }> = {
  normal: { en: "Normal", ar: "طبيعي" }, low: { en: "Low", ar: "منخفض" }, high: { en: "High", ar: "مرتفع" }, critical: { en: "Critical", ar: "حرج" },
};

type Draft = { analyteEn: string; analyteAr: string; value: string; unit: string; refLow: string; refHigh: string };
const emptyRow = (): Draft => ({ analyteEn: "", analyteAr: "", value: "", unit: "", refLow: "", refHigh: "" });
const cell = "h-9 w-full rounded-md bg-surface-container-low px-2 text-sm outline-none focus:ring-2 focus:ring-secondary/50";

export default function ResultsEntryPage() {
  const { locale, t } = useLocale();
  const { user: me } = useAuth();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [panels, setPanels] = useState<LabResultPanel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft[]>([emptyRow()]);
  const [busy, setBusy] = useState(false);
  const [flagType, setFlagType] = useState<"ALLERGY" | "CHRONIC_CONDITION">("CHRONIC_CONDITION");
  const [flagEn, setFlagEn] = useState("");
  const [flagAr, setFlagAr] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await api.getLabResultPanels();
      setPanels(list);
      setActiveId((cur) => (cur && list.some((p) => p.id === cur) ? cur : list[0]?.id ?? null));
    } catch (e) { handleError(e); }
  }, [handleError]);
  useEffect(() => { void load(); }, [load]);

  const active = panels.find((p) => p.id === activeId) ?? null;
  const awaitingEntry = !!active && !active.entered;
  const awaitingVerify = !!active && !!active.entered && !active.verified;
  const hasCritical = active?.rows.some((r) => r.flag === "critical");

  const validDraft = draft.length > 0 && draft.every((r) => r.analyteEn.trim() && r.unit.trim() && [r.value, r.refLow, r.refHigh].every((n) => n.trim() !== "" && Number.isFinite(Number(n))));

  async function save() {
    if (!active) return;
    setBusy(true);
    try {
      await api.enterResults(active.id, draft.map((r) => ({ analyteEn: r.analyteEn.trim(), analyteAr: r.analyteAr.trim() || r.analyteEn.trim(), value: Number(r.value), unit: r.unit.trim(), refLow: Number(r.refLow), refHigh: Number(r.refHigh) })));
      push("success", ar ? "تم حفظ النتائج، بانتظار اعتماد أخصائي آخر" : "Results saved; awaiting a second specialist to verify");
      setDraft([emptyRow()]); await load();
    } catch (e) { handleError(e); } finally { setBusy(false); }
  }

  async function verify() {
    if (!active) return;
    setBusy(true);
    try { await api.verifyLab(active.id); push("success", ar ? "تم اعتماد النتائج" : "Results verified"); await load(); } catch (e) { handleError(e); } finally { setBusy(false); }
  }

  async function submitConditionFlag() {
    if (!active || !flagEn.trim()) return;
    setBusy(true);
    try {
      await api.createConditionFlag({
        patientId: patientId(active.sample.patient),
        sampleId: active.sample.id,
        conditionEn: flagEn.trim(),
        conditionAr: flagAr.trim() || flagEn.trim(),
        conditionType: flagType,
      });
      push("success", ar ? "تم إرسال التنبيه السريري لاعتماد الطبيب المعالج" : "Clinical condition flag sent for physician review");
      setFlagEn("");
      setFlagAr("");
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  }

  const sameSpecialistLock = me?.role === "LAB_TECH" && !!active?.sample.enteredById && active.sample.enteredById === me.id;

  const setCell = (i: number, k: keyof Draft, v: string) => setDraft((d) => d.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader icon={ClipboardCheck} title={ar ? "إدخال واعتماد النتائج" : "Results entry & verification"} badge={ar ? "اعتماد مزدوج" : "Dual sign-off"} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>{ar ? "العينات" : "Samples"}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {panels.length === 0 && <p className="py-6 text-center text-sm text-on-surface-variant">{ar ? "لا توجد عينات قيد التحليل" : "No samples in processing"}</p>}
            {panels.map((p) => (
              <button key={p.id} onClick={() => setActiveId(p.id)} className={cn("flex items-center gap-3 rounded-lg border p-2.5 text-start transition-colors", activeId === p.id ? "border-primary bg-primary-container/10" : "border-outline-variant/40 hover:bg-surface-container-low")}>
                <div className="relative h-9 w-9 shrink-0"><Image src={p.sample.patient.photoUrl} alt="" fill sizes="36px" className="rounded-md object-cover" unoptimized /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-on-surface">{pick(p.sample.patient.fullName, locale)}</p>
                  <p className="truncate text-xs text-on-surface-variant">{pick(p.sample.testPanel, locale)}</p>
                </div>
                {p.verified ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : p.rows.some((r) => r.flag === "critical") ? <AlertTriangle className="h-4 w-4 shrink-0 text-error" /> : null}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {!active ? <p className="py-10 text-center text-sm text-on-surface-variant">{t("common.loading")}</p> : (
            <>
              {hasCritical && !active.verified && (
                <div className="flex items-center gap-2 rounded-lg bg-error-container p-3 text-sm font-semibold text-on-error-container">
                  <AlertTriangle className="h-5 w-5 shrink-0" />{ar ? "توجد قيمة حرجة: أبلغ الطبيب المعالج فور الاعتماد" : "Critical value: notify the treating physician upon verification"}
                </div>
              )}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>{pick(active.sample.testPanel, locale)}</CardTitle>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {(active.sample.orderedBy.en || active.sample.orderedBy.ar) && (
                        <span>{ar ? "طلب:" : "Ordered by:"} {pick(active.sample.orderedBy, locale)}</span>
                      )}
                      {active.sample.enteredBy && (
                        <span> • {ar ? "إدخال:" : "Entered by:"} {pick(active.sample.enteredBy, locale)}</span>
                      )}
                      {active.sample.verifiedBy && (
                        <span> • {ar ? "اعتماد:" : "Verified by:"} {pick(active.sample.verifiedBy, locale)}</span>
                      )}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-on-surface-variant">{active.sample.barcode}</span>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {awaitingEntry ? (
                    <div className="flex min-w-[560px] flex-col gap-2">
                      <div className="grid grid-cols-[1.4fr_1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] gap-2 text-xs font-semibold text-on-surface-variant">
                        <span>Analyte (EN)</span><span>التحليل (عربي)</span><span>{ar ? "القيمة" : "Value"}</span><span>{ar ? "الوحدة" : "Unit"}</span><span>{ar ? "أدنى" : "Low"}</span><span>{ar ? "أعلى" : "High"}</span><span />
                      </div>
                      {draft.map((r, i) => (
                        <div key={i} className="grid grid-cols-[1.4fr_1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] items-center gap-2">
                          <input className={cell} dir="ltr" value={r.analyteEn} onChange={(e) => setCell(i, "analyteEn", e.target.value)} maxLength={80} />
                          <input className={cell} value={r.analyteAr} onChange={(e) => setCell(i, "analyteAr", e.target.value)} maxLength={80} />
                          <input className={cell} dir="ltr" inputMode="decimal" value={r.value} onChange={(e) => setCell(i, "value", e.target.value)} />
                          <input className={cell} dir="ltr" value={r.unit} onChange={(e) => setCell(i, "unit", e.target.value)} maxLength={20} />
                          <input className={cell} dir="ltr" inputMode="decimal" value={r.refLow} onChange={(e) => setCell(i, "refLow", e.target.value)} />
                          <input className={cell} dir="ltr" inputMode="decimal" value={r.refHigh} onChange={(e) => setCell(i, "refHigh", e.target.value)} />
                          <button onClick={() => setDraft((d) => (d.length > 1 ? d.filter((_, idx) => idx !== i) : d))} className="rounded-md p-1.5 text-on-surface-variant hover:bg-error-container" aria-label="remove"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" variant="outline" icon={<Plus className="h-4 w-4" />} onClick={() => setDraft((d) => [...d, emptyRow()])}>{ar ? "إضافة صف" : "Add row"}</Button>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full min-w-[480px] text-start text-sm">
                      <thead><tr className="border-b border-outline-variant/40 text-xs text-on-surface-variant">
                        <th className="py-2 text-start font-semibold">{ar ? "التحليل" : "Analyte"}</th><th className="py-2 text-start font-semibold">{ar ? "النتيجة" : "Result"}</th>
                        <th className="py-2 text-start font-semibold">{ar ? "المعدل الطبيعي" : "Reference"}</th><th className="py-2 text-start font-semibold">{t("common.status")}</th>
                      </tr></thead>
                      <tbody>{active.rows.map((row) => (
                        <tr key={row.id} className="border-b border-outline-variant/20 last:border-0">
                          <td className="py-2.5 font-semibold text-on-surface">{pick(row.analyte, locale)}</td>
                          <td className="py-2.5 font-bold tabular-nums text-on-surface">{row.value} <span className="font-normal text-on-surface-variant">{row.unit}</span></td>
                          <td className="py-2.5 tabular-nums text-on-surface-variant">{row.refLow}–{row.refHigh}</td>
                          <td className="py-2.5"><Badge tone={FLAG_TONE[row.flag]}>{pick(FLAG_LABEL[row.flag], locale)}</Badge></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
              <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 text-xs text-on-surface-variant"><ShieldCheck className="h-4 w-4 text-tertiary" />
                  {active.verified
                    ? (ar ? "تم الاعتماد" : "Verified")
                    : sameSpecialistLock
                      ? (ar ? "يتطلب توقيع فني معمل ثانٍ أو طبيب لاعتماد النتيجة (Dual Sign-Off)" : "Requires a second lab tech or physician for Dual Sign-Off verification")
                      : awaitingVerify
                        ? (ar ? "يجب أن يعتمدها أخصائي غير الذي أدخلها" : "Must be verified by a different specialist than the one who entered it")
                        : (ar ? "أدخل القيم ثم احفظ" : "Enter the values, then save")}
                </span>
                {awaitingEntry && <Button loading={busy} disabled={!validDraft} icon={<Save className="h-4 w-4" />} onClick={save}>{ar ? "حفظ النتائج" : "Save results"}</Button>}
                {awaitingVerify && <Button loading={busy} disabled={sameSpecialistLock} icon={<CheckCircle2 className="h-4 w-4" />} onClick={verify}>{ar ? "اعتماد وإصدار" : "Verify & release"}</Button>}
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Flag className="h-4 w-4 text-error" />
                    {ar ? "رفع تنبيه حساسية أو مرض مزمن للطبيب المعالج" : "Flag Critical Condition / Allergy for Physician Approval"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <select className={cell} value={flagType} onChange={(e) => setFlagType(e.target.value as "ALLERGY" | "CHRONIC_CONDITION")}>
                    <option value="CHRONIC_CONDITION">{ar ? "مرض مزمن مكتشف" : "Chronic Condition"}</option>
                    <option value="ALLERGY">{ar ? "حساسية خطيرة" : "Allergy Alert"}</option>
                  </select>
                  <input className={cell} dir="ltr" placeholder="Condition (EN)" value={flagEn} onChange={(e) => setFlagEn(e.target.value)} />
                  <input className={cell} placeholder="التشخيص / التنبيه (عربي)" value={flagAr} onChange={(e) => setFlagAr(e.target.value)} />
                  <Button size="sm" variant="outline" loading={busy} disabled={!flagEn.trim()} onClick={submitConditionFlag}>
                    {ar ? "إرسال للطبيب" : "Flag to Physician"}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
