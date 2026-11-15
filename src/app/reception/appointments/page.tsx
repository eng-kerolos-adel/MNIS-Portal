"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { CalendarCheck, Check, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/toast/ToastProvider";
import { useApiError } from "@/lib/api/useApiError";
import { api } from "@/lib/data/service";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { pick, formatDate, formatTime } from "@/lib/utils/format";

type Appt = Awaited<ReturnType<typeof api.getAppointments>>[number];
type Doctor = Awaited<ReturnType<typeof api.getDoctors>>[number];
const TONE = { REQUESTED: "warning", CONFIRMED: "success", REJECTED: "error", CANCELLED: "neutral", COMPLETED: "secondary" } as const;
const LABEL: Record<Appt["status"], { en: string; ar: string }> = {
  REQUESTED: { en: "Requested", ar: "بانتظار التأكيد" }, CONFIRMED: { en: "Confirmed", ar: "مؤكد" }, REJECTED: { en: "Rejected", ar: "مرفوض" },
  CANCELLED: { en: "Cancelled", ar: "ملغي" }, COMPLETED: { en: "Completed", ar: "تم" },
};
const field = "h-10 w-full rounded-lg bg-surface-container-low px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/50";

export default function AppointmentRequestsPage() {
  const { locale } = useLocale();
  const { push } = useToast();
  const handleError = useApiError();
  const ar = locale === "ar";
  const [items, setItems] = useState<Appt[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [tab, setTab] = useState<"open" | "all">("open");
  const [sel, setSel] = useState<Appt | null>(null);
  const [when, setWhen] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [slots, setSlots] = useState<{ slotStart: string; slotEnd: string }[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const [a, d] = await Promise.all([api.getAppointments(), api.getDoctors()]); setItems(a); setDoctors(d); } catch (e) { handleError(e); }
  }, [handleError]);
  useEffect(() => { void load(); }, [load]);

  const shown = tab === "open" ? items.filter((i) => i.status === "REQUESTED") : items;

  function open(a: Appt) {
    setSel(a);
    const defaultDate = a.preferredDate ? new Date(a.preferredDate).toISOString().slice(0, 16) : new Date(Date.now() + 3600000).toISOString().slice(0, 16);
    setWhen(defaultDate);
    setDoctorId(a.doctorId ?? doctors[0]?.id ?? "");
    setNote("");
  }

  useEffect(() => {
    if (!doctorId || !when) { setSlots([]); return; }
    const dayStr = when.slice(0, 10);
    api.getDoctorSlots(doctorId, dayStr).then(setSlots).catch(() => setSlots([]));
  }, [doctorId, when]);

  async function confirm() {
    if (!sel || !when) return;
    setBusy(true);
    try {
      await api.confirmAppointment(sel.id, { scheduledAt: new Date(when).toISOString(), doctorId: doctorId || undefined, note: note.trim() || undefined });
      push("success", ar ? "تم تأكيد الموعد وإدراج المريض تلقائياً في طابور الطبيب وإرسال إشعار لتطبيق الموبايل" : "Appointment confirmed, queued for doctor, and citizen notified"); setSel(null); await load();
    } catch (e) { handleError(e); await load(); } finally { setBusy(false); }
  }
  async function reject() {
    if (!sel) return;
    setBusy(true);
    try { await api.rejectAppointment(sel.id, note.trim() || undefined); push("info", ar ? "تم رفض الطلب" : "Request rejected"); setSel(null); await load(); }
    catch (e) { handleError(e); await load(); } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader icon={CalendarCheck} title={ar ? "طلبات المواعيد" : "Appointment requests"} />
      <Card>
        <CardHeader><CardTitle>{ar ? "الطلبات" : "Requests"}</CardTitle>
          <Tabs tabs={[{ id: "open", label: ar ? "بانتظار التأكيد" : "Open", count: items.filter((i) => i.status === "REQUESTED").length }, { id: "all", label: ar ? "الكل" : "All" }]} active={tab} onChange={setTab} />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {shown.length === 0 && <p className="py-8 text-center text-sm text-on-surface-variant">{ar ? "لا توجد طلبات" : "No requests"}</p>}
          {shown.map((a) => (
            <div key={a.id} className="flex flex-col gap-2 rounded-lg border border-outline-variant/40 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0"><Image src={a.patient.photoUrl} alt="" fill sizes="44px" className="rounded-lg object-cover" unoptimized /></div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{pick(a.patient.fullName, locale)}</p>
                  <p className="text-xs text-on-surface-variant">{a.reason} • {ar ? "يفضّل" : "prefers"} {formatDate(a.preferredDate, locale)}</p>
                  {a.scheduledAt && <p className="text-xs font-semibold text-success">{formatDate(a.scheduledAt, locale)} {formatTime(a.scheduledAt, locale)}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 ps-14 sm:ps-0">
                <Badge tone={TONE[a.status]}>{pick(LABEL[a.status], locale)}</Badge>
                {a.status === "REQUESTED" && <Button size="sm" onClick={() => open(a)}>{ar ? "مراجعة" : "Review"}</Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? pick(sel.patient.fullName, locale) : ""}>
        {sel && (
          <div className="flex flex-col gap-3">
            <p className="rounded-lg bg-surface-container-low p-3 text-sm">{sel.reason}</p>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">{ar ? "الموعد" : "Date & time"}
              <input type="datetime-local" dir="ltr" className={field} value={when} onChange={(e) => setWhen(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">{ar ? "الطبيب" : "Doctor"}
              <select className={field} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">{ar ? "— يحدد لاحقاً —" : "— assign later —"}</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{locale === "ar" ? d.fullNameAr : d.fullNameEn}</option>)}
              </select>
            </label>
            {slots.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-on-surface-variant">{ar ? "المواعيد المتاحة في جدول الطبيب لهذا اليوم:" : "Available Doctor Schedule Slots:"}</span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {slots.map((s) => {
                    const timeStr = s.slotStart.includes("T") ? new Date(s.slotStart).toTimeString().slice(0, 5) : s.slotStart.slice(0, 5);
                    const isoLocal = `${when.slice(0, 10)}T${timeStr}`;
                    return (
                      <button
                        key={s.slotStart}
                        type="button"
                        onClick={() => setWhen(isoLocal)}
                        className={`px-2.5 py-1 rounded text-xs font-mono border ${when === isoLocal ? "bg-primary text-on-primary border-primary" : "border-outline-variant/40 hover:bg-surface-container-low"}`}
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <input className={field} placeholder={ar ? "ملاحظة للمواطن (اختياري)" : "Note for the citizen (optional)"} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" loading={busy} icon={<X className="h-4 w-4" />} onClick={reject}>{ar ? "رفض" : "Reject"}</Button>
              <Button loading={busy} disabled={!when} icon={<Check className="h-4 w-4" />} onClick={confirm}>{ar ? "تأكيد" : "Confirm"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
