"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck, CheckCircle2, XCircle, FlaskConical, AlertTriangle, Fingerprint } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api, rxCode } from "@/lib/data/service";
import type { Prescription } from "@/types/domain";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { pick } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const CHECKS = [
  { id: "identity", en: "Patient identity matches the prescription", ar: "تطابق هوية المريض مع الروشتة" },
  { id: "dose", en: "Dosage & frequency within safe range", ar: "الجرعة والتكرار ضمن الحدود الآمنة" },
  { id: "interactions", en: "No critical drug-drug interactions", ar: "لا توجد تداخلات دوائية حرجة" },
  { id: "allergy", en: "No conflict with recorded allergies", ar: "لا يوجد تعارض مع الحساسيات المسجلة" },
  { id: "signature", en: "Prescription is signed by the physician", ar: "الروشتة موقّعة من الطبيب" },
];

export default function RxVerificationPage() {
  const { locale, t } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [rx, setRx] = useState<Prescription[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = (await api.getPrescriptions()).filter((r) => r.status === "signed");
      setRx(list);
      setActiveId((cur) => (cur && list.some((r) => r.id === cur) ? cur : list[0]?.id ?? null));
    } catch (e) { handleError(e); }
  }, [handleError]);
  useEffect(() => { void load(); }, [load]);

  const active = rx.find((r) => r.id === activeId) ?? null;
  const allChecked = CHECKS.every((c) => checks[c.id]);

  async function run(kind: "approve" | "reject") {
    if (!active) return;
    setBusy(true);
    try {
      if (kind === "approve") { await api.verifyRx(active.id); push("success", ar ? "تم اعتماد الروشتة للصرف" : "Approved for dispensing"); }
      else { await api.rejectRx(active.id, reason.trim() || (ar ? "بدون سبب محدد" : "No reason given")); push("info", ar ? "تم رفض الروشتة" : "Prescription rejected"); }
      setChecks({}); setReason(""); await load();
    } catch (e) { handleError(e); await load(); } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader icon={ShieldCheck} title={ar ? "التحقق من الروشتة قبل الصرف" : "Prescription verification"} badge={ar ? "بالانتظار" : "Pending"} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>{ar ? "بانتظار المراجعة" : "Pending review"} ({rx.length})</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {rx.length === 0 && <p className="py-6 text-center text-sm text-on-surface-variant">{ar ? "لا توجد روشتات بانتظار التحقق" : "Nothing waiting for verification"}</p>}
            {rx.map((r) => (
              <button key={r.id} onClick={() => { setActiveId(r.id); setChecks({}); }} className={cn("flex items-center gap-3 rounded-lg border p-2.5 text-start transition-colors", activeId === r.id ? "border-primary bg-primary-container/10" : "border-outline-variant/40 hover:bg-surface-container-low")}>
                <div className="relative h-9 w-9 shrink-0"><Image src={r.patient.photoUrl} alt="" fill sizes="36px" className="rounded-md object-cover" unoptimized /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-on-surface">{pick(r.patient.fullName, locale)}</p>
                  <p className="font-mono text-xs text-on-surface-variant">{rxCode(r)}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {active ? (
            <>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0"><Image src={active.patient.photoUrl} alt="" fill sizes="56px" className="rounded-xl object-cover" unoptimized /></div>
                    <div>
                      <p className="text-base font-bold text-on-surface">{pick(active.patient.fullName, locale)}</p>
                      <p className="text-xs text-on-surface-variant">MTI: {active.patient.mti} • {pick(active.diagnosis, locale)}</p>
                    </div>
                  </div>
                  {active.patient.allergies.length > 0 && (
                    <div className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-error" />{active.patient.allergies.map((a, i) => <Badge key={i} tone="error">{pick(a, locale)}</Badge>)}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="h-4 w-4" />{ar ? "الأصناف الموصوفة" : "Prescribed items"}</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {active.medications.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-surface-container-low p-2.5 text-sm">
                      <span className="font-semibold text-on-surface">{pick(m.name, locale)} — {m.dose}</span>
                      <span className="text-xs text-on-surface-variant">{pick(m.frequency, locale)} • ×{m.quantity}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{ar ? "قائمة التحقق الإلزامية" : "Mandatory checklist"}</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {CHECKS.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-container-low">
                      <input type="checkbox" checked={!!checks[c.id]} onChange={() => setChecks((p) => ({ ...p, [c.id]: !p[c.id] }))} className="h-5 w-5 rounded accent-primary" />
                      <span className="text-sm text-on-surface">{ar ? c.ar : c.en}</span>
                    </label>
                  ))}
                  <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder={ar ? "سبب الرفض (عند الرفض)" : "Rejection reason (if rejecting)"} className="mt-2 h-10 rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50" />
                </CardContent>
              </Card>
              <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 text-xs text-on-surface-variant"><Fingerprint className="h-4 w-4 text-tertiary" />{ar ? "يُسجَّل اسمك ووقت الاعتماد" : "Your name and time are recorded"}</span>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button variant="outline" loading={busy} icon={<XCircle className="h-4 w-4" />} onClick={() => run("reject")}>{ar ? "رفض" : "Reject"}</Button>
                  <Button loading={busy} icon={<CheckCircle2 className="h-4 w-4" />} disabled={!allChecked} onClick={() => run("approve")}>{ar ? "اعتماد للصرف" : "Approve"}</Button>
                </div>
              </Card>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-on-surface-variant">{t("common.loading")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
