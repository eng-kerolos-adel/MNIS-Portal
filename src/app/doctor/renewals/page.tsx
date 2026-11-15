"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { RefreshCw, Check, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { pick, formatDate } from "@/lib/utils/format";

type R = Awaited<ReturnType<typeof api.getRenewals>>[number];

export default function RenewalsPage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [items, setItems] = useState<R[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => { try { setItems(await api.getRenewals()); } catch (e) { handleError(e); } }, [handleError]);
  useEffect(() => { void load(); }, [load]);

  async function act(id: string, kind: "approve" | "reject") {
    setBusyId(id);
    try {
      if (kind === "approve") { await api.approveRenewal(id); push("success", ar ? "تمت الموافقة وأُنشئت مسودة روشتة جديدة" : "Approved; a new draft prescription was created"); }
      else { await api.rejectRenewal(id); push("info", ar ? "تم رفض الطلب" : "Request rejected"); }
      await load();
    } catch (e) { handleError(e); await load(); } finally { setBusyId(null); }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader icon={RefreshCw} title={ar ? "طلبات تجديد الروشتات" : "Prescription renewal requests"} badge={ar ? "من تطبيق المواطن" : "From the citizen app"} />
      <Card>
        <CardHeader><CardTitle>{ar ? "بانتظار قرارك" : "Awaiting your decision"} ({items.length})</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {items.length === 0 && <p className="py-8 text-center text-sm text-on-surface-variant">{ar ? "لا توجد طلبات" : "No requests"}</p>}
          {items.map((r) => (
            <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-outline-variant/40 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0"><Image src={r.patient.photoUrl} alt="" fill sizes="44px" className="rounded-lg object-cover" unoptimized /></div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{pick(r.patient.fullName, locale)}</p>
                  <p className="text-xs text-on-surface-variant">{ar ? "طُلب في" : "Requested"} {formatDate(r.createdAt, locale)} • MTI {r.patient.mti}</p>
                </div>
              </div>
              <div className="flex gap-2 ps-14 sm:ps-0">
                <Button size="sm" variant="outline" loading={busyId === r.id} icon={<X className="h-4 w-4" />} onClick={() => act(r.id, "reject")}>{ar ? "رفض" : "Reject"}</Button>
                <Button size="sm" loading={busyId === r.id} icon={<Check className="h-4 w-4" />} onClick={() => act(r.id, "approve")}>{ar ? "موافقة" : "Approve"}</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <p className="text-xs text-on-surface-variant">{ar ? "الموافقة تُنشئ مسودة نسخة من الروشتة السابقة تراجعها وتوقّعها بنفسك قبل أن تصل للصيدلية." : "Approving creates a draft copy of the previous prescription that you still review and sign before it reaches the pharmacy."}</p>
    </div>
  );
}
